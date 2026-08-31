import { createHash } from "node:crypto"
import { closeSync, constants, existsSync, fstatSync, openSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  executeV138Plan133DisposableObservationsForReview,
} from "./check-v1-38-plan-262-133-live-v13-custody-review-v5.js"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Json = Record<string, any>
type Sha = `sha256:${string}`

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const V5 = Object.freeze({
  source: "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts",
  test: "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.test.ts",
  payload: ".planning/artifacts/v1.38-plan-262-133-live-v13-custody-review-payload-v5.json",
  review: `${PHASE}/262-133-REVIEW-v5.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-133-live-v13-custody-review-carrier-v5.json",
  summary: `${PHASE}/262-133-SUMMARY.md`,
  codeReview: `${PHASE}/262-133-CODE-REVIEW.md`,
  sourceCommit: "222cecd6c8f633e1cec5ae916f95389f9a5f7876",
  sourceTree: "a0e7f5fb22212e4a3e9b6a4d687f030c331d80a6",
  sourceParent: "bfea1ea6f26ac6d8e56512548f805b2a86e516e6",
  sourceBlob: "28f8500db03bd81c2cbfe17c54f8cc2cf946e807",
  sourceSha: "sha256:3bd4e8f2e5d994a45fe6a15659442ffe2e7e5b611ecf9205665597ef11fa43dc",
  testBlob: "dcf81600b80a0c07d2145d3c5eac030dab45765c",
  testSha: "sha256:cfd5f3787184f2b6db033bf2de619b61ac6eeb03aa92f3b201738d8dba592b98",
  publicationCommit: "7bf5b09bf13029cce57e250f75ace5f6b9868900",
  summaryCommit: "ed95a68ca4c97b82bfbc835b42420d4d008f3433",
  trackingCommit: "e2300e286db17ca3a97b22b30946089133a47047",
  reviewCommit: "0da1d2e34eb71df56080212b0e4ffa3e8e11c59a",
  reviewTree: "9532800ef70257b21f521cdcf0453191c27a167f",
  reviewParent: "e2300e286db17ca3a97b22b30946089133a47047",
  reviewBlob: "153282a3e07da974527b948692ad93ddff636136",
  reviewSha: "sha256:2187b34625e46a3a8e72a4f6b22b3f6ccbe111a3718f6ac8520898ac3d8a1d10",
  payloadBlob: "564401249577adcba7f08c865ccfed37f559e962",
  payloadSha: "sha256:88c5a476c3001b41442a9f72d9ac8f06c8afca4e81966e687856aac552a45ac8",
  reviewEvidenceBlob: "cf2a57ad7e8868cc0d9a1bf931181ba79cbaf8ae",
  reviewEvidenceSha: "sha256:e456a7104b130881b8f799ec6649080dbf768529683311df61855a2a01ab78fa",
  carrierBlob: "c0fe78e91dbec61f7cc8cdaf9c0aa2094a6d7aa9",
  carrierSha: "sha256:5069bc3d780f7afb6b10c6e6d54a9586f915a8468497f9e0a3a8af5a862880c1",
  summaryBlob: "49fe31fdd46da8405f478ca459befb0599afd8a8",
  summarySha: "sha256:4a38adfa858ce6fd3db94350419a2f1b7ae808c9ebb5f15de87fd262e07d1572",
})

const EFFECT_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
] as const)

const PAYLOAD_KEYS = Object.freeze([
  "actualModesPassed", "authorizationLiteralCreated", "authorizesExecution", "b331Commit",
  "b331Scope", "candidateSearchAuthorized", "canonicalLocalExecutionClosureRoot",
  "canonicalLocalGitObjectRoot", "canonicalLocalInstalledClosureRoot",
  "canonicalLocalNativeSourcesRoot", "canonicalReviewedClosureRoot", "cleanReviewCommit",
  "closeoutCommit", "counters", "createsCapacity", "downstreamAuthority", "findingCount",
  "findings", "formationMaterializationAuthorized", "freshAccepted", "freshCharged",
  "holdoutOpeningAuthorized", "installedClosureRoot", "liveInvoked", "observations",
  "observationsRoot", "payloadRoot", "phase263PlanningAuthorized", "plan110Eligible",
  "plan131ReviewCommit", "plan135Eligible", "producerCalls", "productAuthorized",
  "productionAuthorized", "protocol", "publicAuthorized", "readinessInvoked",
  "recursiveDependencyCount", "recursiveDependencyRoot", "requiredAccepted", "resetsCounters",
  "schemaVersion", "sourceBlob", "sourceOnly", "sourceSha256", "subjectCommit",
  "subjectParent", "subjectTree", "supersededV3CarrierRoot", "supersededV3PayloadRoot",
  "supersededV3Plan110Eligible", "supersededV3ReviewRoot", "supersededV4CarrierRoot",
  "supersededV4PayloadRoot", "supersededV4Plan110Eligible", "supersededV4ReviewRoot",
  "supersededV5Plan110Eligible", "testBlob", "testSha256", "v3Disposition",
  "v3PublicationCommit", "v4Disposition", "v4PublicationCommit", "v4StoredPlan110Eligible",
  "v4SummaryCommit", "v5CarrierRoot", "v5Disposition", "v5PayloadRoot",
  "v5PublicationCommit", "v5ReviewCommit", "v5ReviewRoot", "v5SummaryCommit",
  "v5TrackingCommit",
].sort())
const CARRIER_KEYS = Object.freeze([
  "actualModesPassed", "authorizationLiteralCreated", "authorizesExecution", "carrierRoot",
  "createsCapacity", "downstreamAuthority", "findingCount", "freshAccepted", "freshCharged",
  "liveInvoked", "payloadMode", "payloadRoot", "payloadSha256", "plan110Eligible",
  "plan135Eligible", "producerCalls", "protocol", "readinessInvoked", "requiredAccepted",
  "resetsCounters", "reviewMode", "reviewRoot", "reviewSha256", "schemaVersion", "sourceOnly",
  "subjectCommit", "supersededV5Plan110Eligible", "v5Disposition",
].sort())
const COUNTER_KEYS = Object.freeze(["acceptedCells", "calibrationIdentitiesCharged",
  "preflightObservationsConsumed", "reproductionIdentitiesCharged", "routeStartsConsumed"].sort())
const OBSERVATION_KEYS = Object.freeze(["disposableLocalExecutionClosureRoot",
  "disposableLocalGitObjectRoot", "disposableLocalInstalledClosureRoot",
  "disposableLocalNativeSourcePaths", "disposableLocalNativeSourcesRoot",
  "disposableReviewedClosureRoot", "mode", "observationRoot", "producerGuardCount",
  "reducedValue", "status"].sort())
const NO_EFFECT_REDUCED_KEYS = Object.freeze(["downstreamAuthority", "freshAccepted",
  "freshCharged", "liveInvoked", "producerCalls", "readinessInvoked"].sort())
const MODES = Object.freeze([
  ["--check-source-only", "source_only_checked"],
  ["--check-prospective-custody", "prospective_custody_checked"],
  ["--check-post-run-custody", "post_run_no_effect_custody_checked"],
  ["--check-non-pass-value", "bounded_non_pass_value_checked"],
  ["--check-bounded-success-value", "bounded_success_value_checked"],
  ["--check-exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
] as const)

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const isObject = (value: unknown): value is Json => value !== null && typeof value === "object" &&
  !Array.isArray(value)
const exactKeys = (value: unknown, expected: readonly string[], code: string): asserts value is Json => {
  if (!isObject(value) || canonical(Object.keys(value).sort()) !== canonical([...expected].sort())) fail(code)
}
const isSha = (value: unknown): value is Sha => typeof value === "string" &&
  /^sha256:[0-9a-f]{64}$/u.test(value)
const target = (root: string, repoPath: string): string => path.join(root, ...repoPath.split("/"))
const readNoFollow = (root: string, repoPath: string): Buffer => {
  let fd: number | undefined
  try {
    fd = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(fd)
    if (!before.isFile() || (before.mode & 0o7777) !== 0o644 || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN134_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(fd); const after = fstatSync(fd)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN134_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN134_")) throw error
    fail(`V138_PLAN134_ENTRY_INVALID:${repoPath}`)
  } finally { if (fd !== undefined) closeSync(fd) }
}
const parseCanonical = (bytes: Buffer, code: string): Json => {
  try {
    const value = JSON.parse(bytes.toString("utf8")) as unknown
    if (!isObject(value) || !bytes.equals(Buffer.from(canonical(value)))) fail(code)
    return value
  } catch (error) {
    if (error instanceof Error && error.message === code) throw error
    fail(code)
  }
}
const assertScope = (root: string, commit: string, expected: readonly string[], code: string): void => {
  const actual = runV138RetryV3IsolatedGit(root,
    ["diff-tree", "--no-commit-id", "--name-status", "-r", commit]).split("\n").filter(Boolean).sort()
  if (canonical(actual) !== canonical([...expected].sort())) fail(code)
}
const assertCommit = (root: string, commit: string, tree: string, parent: string, code: string): void => {
  const actual = runV138RetryV3IsolatedGit(root, ["show", "--format=%H%n%T%n%P", "--no-patch", commit])
  if (actual !== `${commit}\n${tree}\n${parent}`) fail(code)
}
const assertCommittedFile = (root: string, head: string, commit: string, repoPath: string,
  blob: string, expectedSha: Sha, current = true): Buffer => {
  if (runV138RetryV3IsolatedGit(root, ["ls-tree", commit, "--", repoPath]) !==
      `100644 blob ${blob}\t${repoPath}`) fail(`V138_PLAN134_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const bytes = runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
  if (sha(bytes) !== expectedSha) fail(`V138_PLAN134_COMMITTED_BYTES_INVALID:${repoPath}`)
  if (runV138RetryV3IsolatedGit(root, ["log", "--format=%H", `${commit}..${head}`, "--", repoPath]) !== "")
    fail(`V138_PLAN134_PROTECTED_REWRITE:${repoPath}`)
  if (current && !readNoFollow(root, repoPath).equals(bytes))
    fail(`V138_PLAN134_CURRENT_BYTES_INVALID:${repoPath}`)
  return bytes
}

const validateObservation = (observation: unknown, index: number, domain: "v5" | "v6"): void => {
  exactKeys(observation, OBSERVATION_KEYS, "V138_PLAN134_OBSERVATION_SCHEMA_INVALID")
  const [mode, status] = MODES[index] ?? fail("V138_PLAN134_OBSERVATION_COUNT_INVALID")
  if (observation.mode !== mode || observation.status !== status || observation.producerGuardCount !== 0 ||
      !Array.isArray(observation.disposableLocalNativeSourcePaths) ||
      observation.disposableLocalNativeSourcePaths.length !== 2 ||
      !observation.disposableLocalNativeSourcePaths.every((value: unknown) => typeof value === "string") ||
      !["disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
        "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcesRoot",
        "disposableReviewedClosureRoot", "observationRoot"]
        .every((key) => isSha(observation[key]))) fail("V138_PLAN134_OBSERVATION_SEMANTICS_INVALID")
  const reduced = observation.reducedValue
  if (index < 3) {
    exactKeys(reduced, NO_EFFECT_REDUCED_KEYS, "V138_PLAN134_REDUCED_SCHEMA_INVALID")
    if (reduced.downstreamAuthority !== "denied" || reduced.freshAccepted !== 0 ||
        reduced.freshCharged !== 0 || reduced.liveInvoked !== false || reduced.producerCalls !== 0 ||
        reduced.readinessInvoked !== false) fail("V138_PLAN134_REDUCED_SEMANTICS_INVALID")
  } else if (index === 3 || index === 4) {
    exactKeys(reduced, ["classification", "reproductionEligible"], "V138_PLAN134_REDUCED_SCHEMA_INVALID")
    const expected = index === 3 ? ["non_pass", false] : ["bounded_success", true]
    if (reduced.classification !== expected[0] || reduced.reproductionEligible !== expected[1])
      fail("V138_PLAN134_REDUCED_SEMANTICS_INVALID")
  } else {
    exactKeys(reduced, ["acceptedCells", "exact", "requiredAccepted"],
      "V138_PLAN134_REDUCED_SCHEMA_INVALID")
    if (reduced.acceptedCells !== 540 || reduced.exact !== true || reduced.requiredAccepted !== 540)
      fail("V138_PLAN134_REDUCED_SEMANTICS_INVALID")
  }
  const { observationRoot, ...body } = observation
  const expectedRoot = rooted(domain === "v5"
    ? "v138-plan-262-133-mode-observation-v5"
    : "v138-plan-262-134-mode-observation-v6", body)
  if (observationRoot !== expectedRoot) fail("V138_PLAN134_OBSERVATION_ROOT_INVALID")
}

const validateV5 = (root: string) => {
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "--verify", "HEAD^{commit}"])
  for (const commit of [V5.sourceCommit, V5.publicationCommit, V5.summaryCommit, V5.trackingCommit,
    V5.reviewCommit]) {
    try { runV138RetryV3IsolatedGit(root, ["merge-base", "--is-ancestor", commit, head]) }
    catch { fail("V138_PLAN134_HEAD_NOT_DESCENDANT") }
  }
  assertCommit(root, V5.sourceCommit, V5.sourceTree, V5.sourceParent, "V138_PLAN134_SOURCE_COMMIT_INVALID")
  assertCommit(root, V5.reviewCommit, V5.reviewTree, V5.reviewParent, "V138_PLAN134_REVIEW_COMMIT_INVALID")
  assertScope(root, V5.publicationCommit, [`A\t${V5.carrier}`, `A\t${V5.payload}`, `A\t${V5.review}`],
    "V138_PLAN134_V5_PUBLICATION_SCOPE_INVALID")
  assertScope(root, V5.summaryCommit, [`A\t${V5.summary}`], "V138_PLAN134_V5_SUMMARY_SCOPE_INVALID")
  assertScope(root, V5.trackingCommit, ["M\t.planning/ROADMAP.md", "M\t.planning/STATE.md"],
    "V138_PLAN134_V5_TRACKING_SCOPE_INVALID")
  assertScope(root, V5.reviewCommit, [`A\t${V5.codeReview}`], "V138_PLAN134_REVIEW_SCOPE_INVALID")
  const sourceBytes = assertCommittedFile(root, head, V5.sourceCommit, V5.source, V5.sourceBlob, V5.sourceSha)
  const testBytes = assertCommittedFile(root, head, V5.sourceCommit, V5.test, V5.testBlob, V5.testSha)
  const payloadBytes = assertCommittedFile(root, head, V5.publicationCommit, V5.payload,
    V5.payloadBlob, V5.payloadSha)
  const reviewBytes = assertCommittedFile(root, head, V5.publicationCommit, V5.review,
    V5.reviewEvidenceBlob, V5.reviewEvidenceSha)
  const carrierBytes = assertCommittedFile(root, head, V5.publicationCommit, V5.carrier,
    V5.carrierBlob, V5.carrierSha)
  assertCommittedFile(root, head, V5.summaryCommit, V5.summary, V5.summaryBlob, V5.summarySha)
  assertCommittedFile(root, head, V5.reviewCommit, V5.codeReview, V5.reviewBlob, V5.reviewSha)
  const payload = parseCanonical(payloadBytes, "V138_PLAN134_V5_PAYLOAD_INVALID")
  const carrier = parseCanonical(carrierBytes, "V138_PLAN134_V5_CARRIER_INVALID")
  const { payloadRoot, ...payloadBody } = payload
  const { carrierRoot, ...carrierBody } = carrier
  if (payloadRoot !== rooted("v138-plan-262-133-live-v13-custody-review-payload-v5", payloadBody) ||
      carrierRoot !== rooted("v138-plan-262-133-live-v13-custody-review-carrier-v5", carrierBody) ||
      carrier.payloadRoot !== payloadRoot || carrier.payloadSha256 !== sha(payloadBytes) ||
      carrier.reviewSha256 !== sha(reviewBytes) || carrier.reviewRoot !== "sha256:94b384e9ed7b03bac339cdb6b3384b93192d3bb5fc4986b6cf0edfce041afbaf")
    fail("V138_PLAN134_V5_ROOT_OR_LINK_INVALID")
  for (const item of [payload, carrier]) if (item.authorizesExecution !== false ||
      item.createsCapacity !== false || item.resetsCounters !== false ||
      item.authorizationLiteralCreated !== false || item.producerCalls !== 0 ||
      item.readinessInvoked !== false || item.liveInvoked !== false || item.freshCharged !== 0 ||
      item.freshAccepted !== 0 || item.downstreamAuthority !== "denied")
    fail("V138_PLAN134_V5_NO_EFFECT_INVALID")
  if (payload.phase263PlanningAuthorized !== false || payload.candidateSearchAuthorized !== false ||
      payload.formationMaterializationAuthorized !== false || payload.holdoutOpeningAuthorized !== false ||
      payload.publicAuthorized !== false || payload.productAuthorized !== false ||
      payload.productionAuthorized !== false || payload.findingCount !== 0 ||
      payload.actualModesPassed !== 6 || payload.plan110Eligible !== true ||
      !Array.isArray(payload.findings) || payload.findings.length !== 0 ||
      !Array.isArray(payload.observations) || payload.observations.length !== 6)
    fail("V138_PLAN134_V5_SEMANTICS_INVALID")
  exactKeys(payload.counters, COUNTER_KEYS, "V138_PLAN134_V5_COUNTER_SCHEMA_INVALID")
  if (!Object.values(payload.counters).every((value) => value === 0))
    fail("V138_PLAN134_V5_COUNTER_SEMANTICS_INVALID")
  for (const [index, observation] of payload.observations.entries()) validateObservation(observation, index, "v5")
  if (payload.observationsRoot !== rooted("v138-plan-262-133-observations-v5", payload.observations))
    fail("V138_PLAN134_V5_OBSERVATIONS_ROOT_INVALID")
  return Object.freeze({ payload, carrier, payloadBytes, reviewBytes, carrierBytes,
    sourceSha256: sha(sourceBytes), testSha256: sha(testBytes) })
}

const copyObservationV6 = (input: Json): Json => {
  const { observationRoot: _ignored, ...body } = structuredClone(input)
  return Object.freeze({ ...body,
    observationRoot: rooted("v138-plan-262-134-mode-observation-v6", body) })
}

let cached: Readonly<{ payload: Json; reviewBytes: Uint8Array; carrier: Json }> | undefined

export const rootV138Plan134PayloadForReview = (payloadInput: Json): Sha => {
  const { payloadRoot: _ignored, ...body } = payloadInput
  return rooted("v138-plan-262-134-live-v13-custody-payload-v6", body)
}
export const shaV138Plan134PayloadForReview = (payloadInput: Json): Sha =>
  sha(Buffer.from(canonical(payloadInput)))
export const rootV138Plan134CarrierForReview = (carrierInput: Json): Sha => {
  const { carrierRoot: _ignored, ...body } = carrierInput
  return rooted("v138-plan-262-134-live-v13-custody-carrier-v6", body)
}

export const buildV138Plan134ProspectiveV6ForReview = (rootInput: string) => {
  if (cached !== undefined) return structuredClone(cached)
  const root = path.resolve(rootInput)
  for (const repoPath of EFFECT_PATHS) if (existsSync(target(root, repoPath)))
    fail(`V138_PLAN134_EFFECT_PRESENT:${repoPath}`)
  const v5 = validateV5(root)
  const fresh = executeV138Plan133DisposableObservationsForReview(root)
  if (fresh.findings.length !== 0 || fresh.actualModesPassed !== 6 || fresh.observations.length !== 6)
    fail("V138_PLAN134_FRESH_OBSERVATIONS_INVALID")
  const observations = fresh.observations.map((item) => copyObservationV6(item as Json))
  for (const [index, observation] of observations.entries()) validateObservation(observation, index, "v6")
  const body: Json = {
    ...structuredClone(v5.payload),
    schemaVersion: "v1.38-plan-262-134-live-v13-custody-payload-v6",
    protocol: "source-only-authority-carrier-correction-v6",
    sourceOnly: true,
    v5Disposition: "process_invalid_authority_carrier_validation",
    v5PublicationCommit: V5.publicationCommit,
    v5SummaryCommit: V5.summaryCommit,
    v5TrackingCommit: V5.trackingCommit,
    v5ReviewCommit: V5.reviewCommit,
    v5PayloadRoot: v5.payload.payloadRoot,
    v5ReviewRoot: v5.carrier.reviewRoot,
    v5CarrierRoot: v5.carrier.carrierRoot,
    supersededV5Plan110Eligible: false,
    plan110Eligible: false,
    plan135Eligible: true,
    requiredAccepted: 540,
    observations,
    observationsRoot: rooted("v138-plan-262-134-observations-v6", observations),
  }
  delete body.payloadRoot
  const payload = Object.freeze({ ...body,
    payloadRoot: rooted("v138-plan-262-134-live-v13-custody-payload-v6", body) })
  const carrierBody: Json = {
    schemaVersion: "v1.38-plan-262-134-live-v13-custody-carrier-v6",
    protocol: "nonpublishing-source-only-carrier-v6",
    sourceOnly: true,
    subjectCommit: V5.sourceCommit,
    payloadMode: "100644",
    payloadRoot: payload.payloadRoot,
    payloadSha256: sha(Buffer.from(canonical(payload))),
    reviewMode: "100644",
    reviewRoot: v5.carrier.reviewRoot,
    reviewSha256: sha(v5.reviewBytes),
    findingCount: 0,
    actualModesPassed: 6,
    v5Disposition: "process_invalid_authority_carrier_validation",
    supersededV5Plan110Eligible: false,
    plan110Eligible: false,
    plan135Eligible: true,
    authorizesExecution: false,
    createsCapacity: false,
    resetsCounters: false,
    authorizationLiteralCreated: false,
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    requiredAccepted: 540,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody,
    carrierRoot: rooted("v138-plan-262-134-live-v13-custody-carrier-v6", carrierBody) })
  cached = Object.freeze({ payload, reviewBytes: Uint8Array.from(v5.reviewBytes), carrier })
  return structuredClone(cached)
}

const assertNoAuthority = (item: Json, code: string): void => {
  if (item.authorizesExecution !== false || item.createsCapacity !== false ||
      item.resetsCounters !== false || item.authorizationLiteralCreated !== false ||
      item.producerCalls !== 0 || item.readinessInvoked !== false || item.liveInvoked !== false ||
      item.freshCharged !== 0 || item.freshAccepted !== 0 || item.requiredAccepted !== 540 ||
      item.downstreamAuthority !== "denied") fail(code)
}

export const authenticateV138Plan134ProspectiveV6ForReview = (input: unknown) => {
  exactKeys(input, ["carrier", "payload", "reviewBytes"], "V138_PLAN134_EVIDENCE_SCHEMA_INVALID")
  exactKeys(input.payload, PAYLOAD_KEYS, "V138_PLAN134_PAYLOAD_SCHEMA_INVALID")
  exactKeys(input.carrier, CARRIER_KEYS, "V138_PLAN134_CARRIER_SCHEMA_INVALID")
  if (!(input.reviewBytes instanceof Uint8Array)) fail("V138_PLAN134_REVIEW_BYTES_INVALID")
  const payload = input.payload; const carrier = input.carrier
  if (payload.schemaVersion !== "v1.38-plan-262-134-live-v13-custody-payload-v6" ||
      payload.protocol !== "source-only-authority-carrier-correction-v6" ||
      payload.sourceOnly !== true || payload.v5Disposition !== "process_invalid_authority_carrier_validation" ||
      payload.v5PublicationCommit !== V5.publicationCommit || payload.v5SummaryCommit !== V5.summaryCommit ||
      payload.v5TrackingCommit !== V5.trackingCommit || payload.v5ReviewCommit !== V5.reviewCommit ||
      payload.subjectCommit !== "52d35eb88db55e31d7203abb64735d12a53bbcf3" ||
      payload.plan110Eligible !== false || payload.plan135Eligible !== true ||
      payload.supersededV5Plan110Eligible !== false || payload.findingCount !== 0 ||
      payload.actualModesPassed !== 6 || !Array.isArray(payload.findings) || payload.findings.length !== 0 ||
      payload.phase263PlanningAuthorized !== false || payload.candidateSearchAuthorized !== false ||
      payload.formationMaterializationAuthorized !== false || payload.holdoutOpeningAuthorized !== false ||
      payload.publicAuthorized !== false || payload.productAuthorized !== false ||
      payload.productionAuthorized !== false) fail("V138_PLAN134_PAYLOAD_SEMANTICS_INVALID")
  assertNoAuthority(payload, "V138_PLAN134_PAYLOAD_SEMANTICS_INVALID")
  exactKeys(payload.counters, COUNTER_KEYS, "V138_PLAN134_COUNTER_SCHEMA_INVALID")
  if (!Object.values(payload.counters).every((value) => value === 0))
    fail("V138_PLAN134_COUNTER_SEMANTICS_INVALID")
  if (!Array.isArray(payload.observations) || payload.observations.length !== 6)
    fail("V138_PLAN134_OBSERVATION_COUNT_INVALID")
  for (const [index, observation] of payload.observations.entries()) validateObservation(observation, index, "v6")
  if (payload.observationsRoot !== rooted("v138-plan-262-134-observations-v6", payload.observations) ||
      payload.payloadRoot !== rootV138Plan134PayloadForReview(payload))
    fail("V138_PLAN134_PAYLOAD_ROOT_INVALID")
  if (carrier.schemaVersion !== "v1.38-plan-262-134-live-v13-custody-carrier-v6" ||
      carrier.protocol !== "nonpublishing-source-only-carrier-v6" || carrier.sourceOnly !== true ||
      carrier.subjectCommit !== V5.sourceCommit || carrier.payloadMode !== "100644" ||
      carrier.reviewMode !== "100644" || carrier.v5Disposition !== payload.v5Disposition ||
      carrier.supersededV5Plan110Eligible !== false || carrier.plan110Eligible !== false ||
      carrier.plan135Eligible !== true || carrier.findingCount !== 0 || carrier.actualModesPassed !== 6)
    fail("V138_PLAN134_CARRIER_SEMANTICS_INVALID")
  assertNoAuthority(carrier, "V138_PLAN134_CARRIER_SEMANTICS_INVALID")
  if (carrier.payloadRoot !== payload.payloadRoot ||
      carrier.payloadSha256 !== shaV138Plan134PayloadForReview(payload) ||
      carrier.reviewSha256 !== sha(input.reviewBytes) ||
      carrier.reviewRoot !== payload.v5ReviewRoot ||
      carrier.carrierRoot !== rootV138Plan134CarrierForReview(carrier))
    fail("V138_PLAN134_CARRIER_LINK_OR_ROOT_INVALID")
  if (cached === undefined || canonical(input) !== canonical(cached))
    fail("V138_PLAN134_AUTHENTICATED_BYTES_MISMATCH")
  return Object.freeze({
    sourceOnly: payload.sourceOnly,
    v5Disposition: payload.v5Disposition,
    supersededV5Plan110Eligible: payload.supersededV5Plan110Eligible,
    plan135Eligible: payload.plan135Eligible,
    plan110Eligible: payload.plan110Eligible,
    authorizesExecution: carrier.authorizesExecution,
    createsCapacity: carrier.createsCapacity,
    resetsCounters: carrier.resetsCounters,
    authorizationLiteralCreated: carrier.authorizationLiteralCreated,
    producerCalls: carrier.producerCalls,
    readinessInvoked: carrier.readinessInvoked,
    liveInvoked: carrier.liveInvoked,
    freshCharged: carrier.freshCharged,
    freshAccepted: carrier.freshAccepted,
    requiredAccepted: carrier.requiredAccepted,
    downstreamAuthority: carrier.downstreamAuthority,
    payloadRoot: payload.payloadRoot,
    reviewRoot: carrier.reviewRoot,
    carrierRoot: carrier.carrierRoot,
  })
}

export const checkV138Plan134SourceOnlyForReview = (rootInput: string) =>
  authenticateV138Plan134ProspectiveV6ForReview(buildV138Plan134ProspectiveV6ForReview(rootInput))

const execute = (args: readonly string[]): void => {
  if (args.length !== 1 || args[0] !== "--check-source-only") fail("V138_PLAN134_ARGUMENTS_INVALID")
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  process.stdout.write(`${JSON.stringify(checkV138Plan134SourceOnlyForReview(root))}\n`)
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
