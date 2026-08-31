import { createHash } from "node:crypto"
import { closeSync, constants, existsSync, fstatSync, openSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { executeV138Plan133DisposableObservationsForReview } from
  "./check-v1-38-plan-262-133-live-v13-custody-review-v5.js"
import { runV138RetryV3IsolatedGit, runV138RetryV3IsolatedGitBytes } from
  "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Json = Record<string, any>
type Sha = `sha256:${string}`

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const LIVE_SUBJECT = "3882cd5d3ec7a834e1de88254dd0daf955da12aa"
const PLAN136 = Object.freeze({
  source: "scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts",
  test: "scripts/check-v1-38-plan-262-136-live-v13-custody-v7.test.ts",
  summary: `${PHASE}/262-136-SUMMARY.md`, review: `${PHASE}/262-136-CODE-REVIEW.md`,
  sourceCommit: "5bbc3dd3c126ab03b69eb5efea1e17d1404b97c5",
  sourceTree: "160c38514b8d0ec7cd7ec303415d05146b8a1ad1",
  sourceParent: "3aafd6ebed361f6de0822b5da1939ef83c303096",
  sourceBlob: "012ae30b5090c42b247e43ac915681d26fd72861",
  sourceSha: "sha256:fc5ca46fb81f1d4d54353480bc676096c353100ab39215988ce0859b646783c5",
  testBlob: "10d324797be6d8fa55ac1362e5c0bfbfa8aba330",
  testSha: "sha256:2b91624502d3150a1c85f141651c67871b312d3c11888e979588a142067d3575",
  summaryCommit: "f22a70225162cef949c8db513fff22ef351270e4",
  summaryBlob: "1a15c75687627687a09100204654db8f34411528",
  summarySha: "sha256:0f356cb81f2cee3a022c3a399d61ceaf68dea6b677fb5c8408f899eae856f49b",
  trackingCommit: "13dc20a5f881441b501a87d88ce9f5f6de5c4162",
  reviewCommit: "9e82ea12af8e63fce5172e5e77ff15c68648ad11",
  reviewBlob: "9cea509302dade7b32dd7f13783971844c7f5680",
  reviewSha: "sha256:c618bb1dde223a32911f49342343d7fc8caf2de4a363f14c03d977801aaf13b5",
})
const NATIVE_IDENTITIES = Object.freeze([
  Object.freeze({ path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644",
    blob: "ca694310a8a99c30d7a4070a415b968d3e341409",
    contentSha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" }),
  Object.freeze({ path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644",
    blob: "99da3517ccb8b919759663daf713b4f20337b8b1",
    contentSha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" }),
] as const)
const MODES = Object.freeze([
  ["--check-source-only", "source_only_checked"],
  ["--check-prospective-custody", "prospective_custody_checked"],
  ["--check-post-run-custody", "post_run_no_effect_custody_checked"],
  ["--check-non-pass-value", "bounded_non_pass_value_checked"],
  ["--check-bounded-success-value", "bounded_success_value_checked"],
  ["--check-exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
] as const)
const EFFECT_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-138-live-v13-custody-payload-v8.json",
  `${PHASE}/262-138-REVIEW-v8.md`,
  ".planning/artifacts/v1.38-plan-262-138-live-v13-custody-carrier-v8.json",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
] as const)
const AUTHORITY_KEYS = Object.freeze(["authorizationLiteralCreated", "authorizesExecution",
  "candidateSearchAuthorized", "createsCapacity", "formationMaterializationAuthorized",
  "holdoutOpeningAuthorized", "phase263PlanningAuthorized", "productAuthorized",
  "productionAuthorized", "publicAuthorized", "resetsCounters"] as const)
const COUNTER_KEYS = Object.freeze(["acceptedCells", "calibrationIdentitiesCharged",
  "preflightObservationsConsumed", "reproductionIdentitiesCharged", "routeStartsConsumed"] as const)

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Json).sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, normalize(child)])) : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const gitBlob = (value: Uint8Array): string => createHash("sha1")
  .update(`blob ${value.byteLength}\0`).update(value).digest("hex")
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const target = (root: string, repoPath: string): string => path.join(root, ...repoPath.split("/"))
const isObject = (value: unknown): value is Json => value !== null && typeof value === "object" &&
  !Array.isArray(value)
const isSha = (value: unknown): value is Sha => typeof value === "string" &&
  /^sha256:[0-9a-f]{64}$/u.test(value)
const exactKeys = (value: unknown, keys: readonly string[], code: string): asserts value is Json => {
  if (!isObject(value) || canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const readNoFollow = (root: string, repoPath: string): Buffer => {
  let fd: number | undefined
  try {
    fd = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(fd)
    if (!before.isFile() || (before.mode & 0o7777) !== 0o644 || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN138_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(fd); const after = fstatSync(fd)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN138_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN138_")) throw error
    fail(`V138_PLAN138_ENTRY_INVALID:${repoPath}`)
  } finally { if (fd !== undefined) closeSync(fd) }
}
const assertAncestor = (root: string, ancestor: string, head: string): void => {
  try { runV138RetryV3IsolatedGit(root, ["merge-base", "--is-ancestor", ancestor, head]) }
  catch { fail("V138_PLAN138_HEAD_NOT_DESCENDANT") }
}
const assertScope = (root: string, commit: string, expected: readonly string[], code: string): void => {
  const actual = runV138RetryV3IsolatedGit(root,
    ["diff-tree", "--no-commit-id", "--name-status", "-r", commit]).split("\n").filter(Boolean).sort()
  if (canonical(actual) !== canonical([...expected].sort())) fail(code)
}
const assertCommittedFile = (root: string, head: string, commit: string, repoPath: string,
  blob: string, expectedSha: Sha): Buffer => {
  if (runV138RetryV3IsolatedGit(root, ["ls-tree", commit, "--", repoPath]) !==
      `100644 blob ${blob}\t${repoPath}`) fail(`V138_PLAN138_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const bytes = runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
  if (sha(bytes) !== expectedSha || !readNoFollow(root, repoPath).equals(bytes) ||
      runV138RetryV3IsolatedGit(root, ["log", "--format=%H", `${commit}..${head}`, "--", repoPath]) !== "")
    fail(`V138_PLAN138_PROTECTED_BYTES_INVALID:${repoPath}`)
  return bytes
}

const authenticateHistory = (root: string): { head: string, reviewBytes: Buffer } => {
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "--verify", "HEAD^{commit}"])
  for (const commit of [LIVE_SUBJECT, PLAN136.sourceCommit, PLAN136.summaryCommit,
    PLAN136.trackingCommit, PLAN136.reviewCommit]) assertAncestor(root, commit, head)
  if (runV138RetryV3IsolatedGit(root, ["show", "--format=%H%n%T%n%P", "--no-patch",
    PLAN136.sourceCommit]) !== `${PLAN136.sourceCommit}\n${PLAN136.sourceTree}\n${PLAN136.sourceParent}`)
    fail("V138_PLAN138_PLAN136_COMMIT_INVALID")
  assertScope(root, PLAN136.sourceCommit, [`A\t${PLAN136.source}`, `M\t${PLAN136.test}`],
    "V138_PLAN138_PLAN136_SOURCE_SCOPE_INVALID")
  assertScope(root, PLAN136.summaryCommit, [`A\t${PLAN136.summary}`],
    "V138_PLAN138_PLAN136_SUMMARY_SCOPE_INVALID")
  assertScope(root, PLAN136.trackingCommit, ["M\t.planning/ROADMAP.md", "M\t.planning/STATE.md"],
    "V138_PLAN138_PLAN136_TRACKING_SCOPE_INVALID")
  assertScope(root, PLAN136.reviewCommit, [`A\t${PLAN136.review}`],
    "V138_PLAN138_PLAN136_REVIEW_SCOPE_INVALID")
  assertCommittedFile(root, head, PLAN136.sourceCommit, PLAN136.source, PLAN136.sourceBlob, PLAN136.sourceSha)
  assertCommittedFile(root, head, PLAN136.sourceCommit, PLAN136.test, PLAN136.testBlob, PLAN136.testSha)
  assertCommittedFile(root, head, PLAN136.summaryCommit, PLAN136.summary, PLAN136.summaryBlob,
    PLAN136.summarySha)
  const reviewBytes = assertCommittedFile(root, head, PLAN136.reviewCommit, PLAN136.review,
    PLAN136.reviewBlob, PLAN136.reviewSha)
  return { head, reviewBytes }
}

const authenticateNativeIdentities = (root: string, head: string) => {
  const authenticated = NATIVE_IDENTITIES.map((identity) => {
    const entry = runV138RetryV3IsolatedGit(root, ["ls-tree", LIVE_SUBJECT, "--", identity.path])
    if (entry !== `${identity.mode} blob ${identity.blob}\t${identity.path}`)
      fail(`V138_PLAN138_NATIVE_ENTRY_INVALID:${identity.path}`)
    const historical = runV138RetryV3IsolatedGitBytes(root,
      ["cat-file", "blob", `${LIVE_SUBJECT}:${identity.path}`])
    const current = readNoFollow(root, identity.path)
    if (sha(historical) !== identity.contentSha256 || gitBlob(historical) !== identity.blob ||
        !current.equals(historical) || sha(current) !== identity.contentSha256 ||
        runV138RetryV3IsolatedGit(root,
          ["log", "--format=%H", `${LIVE_SUBJECT}..${head}`, "--", identity.path]) !== "")
      fail(`V138_PLAN138_NATIVE_BYTES_INVALID:${identity.path}`)
    return structuredClone(identity)
  })
  return Object.freeze(authenticated)
}

const validateReduced = (item: Json, index: number): void => {
  if (item.producerGuardCount !== 0) fail("V138_PLAN138_PRODUCER_GUARD_INVALID")
  if (index < 3) {
    exactKeys(item.reducedValue, ["downstreamAuthority", "freshAccepted", "freshCharged",
      "liveInvoked", "producerCalls", "readinessInvoked"], "V138_PLAN138_REDUCED_SCHEMA_INVALID")
    if (canonical(item.reducedValue) !== canonical({ downstreamAuthority: "denied", freshAccepted: 0,
      freshCharged: 0, liveInvoked: false, producerCalls: 0, readinessInvoked: false }))
      fail("V138_PLAN138_REDUCED_SEMANTICS_INVALID")
  } else {
    const expected = index === 3 ? { classification: "non_pass", reproductionEligible: false }
      : index === 4 ? { classification: "bounded_success", reproductionEligible: true }
        : { acceptedCells: 540, exact: true, requiredAccepted: 540 }
    if (canonical(item.reducedValue) !== canonical(expected)) fail("V138_PLAN138_REDUCED_SEMANTICS_INVALID")
  }
}

const mapGenuineObservation = (item: Json, ordinal: number, nativeIdentities: readonly Json[]) => {
  const [mode, status] = MODES[ordinal] ?? fail("V138_PLAN138_OBSERVATION_COUNT_INVALID")
  exactKeys(item, ["disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
    "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcePaths",
    "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode", "observationRoot",
    "producerGuardCount", "reducedValue", "status"], "V138_PLAN138_GENUINE_SCHEMA_INVALID")
  if (item.mode !== mode || item.status !== status || !isSha(item.observationRoot) ||
      !isSha(item.disposableLocalNativeSourcesRoot)) fail("V138_PLAN138_GENUINE_SEMANTICS_INVALID")
  validateReduced(item, ordinal)
  if (!Array.isArray(item.disposableLocalNativeSourcePaths) ||
      item.disposableLocalNativeSourcePaths.length !== nativeIdentities.length)
    fail("V138_PLAN138_GENUINE_PATHS_INVALID")
  for (const [index, value] of item.disposableLocalNativeSourcePaths.entries()) {
    const expected = nativeIdentities[index]!.path
    if (typeof value !== "string" || !path.isAbsolute(value) || path.normalize(value) !== value ||
        !value.endsWith(expected) || !value.includes(`/v138-plan133-mode-${ordinal}-`) ||
        !value.slice(0, -expected.length).endsWith("/repo/")) fail("V138_PLAN138_GENUINE_PATHS_INVALID")
  }
  const genuineNativeSourcesRoot = sha(canonical(item.disposableLocalNativeSourcePaths.map(
    (absolute: string, index: number) => [absolute, nativeIdentities[index]!.contentSha256])))
  const { observationRoot: _ignored, ...genuineBody } = item
  if (genuineNativeSourcesRoot !== item.disposableLocalNativeSourcesRoot ||
      item.observationRoot !== rooted("v138-plan-262-133-mode-observation-v5", genuineBody))
    fail("V138_PLAN138_GENUINE_ROOT_INVALID")
  const stableNativeIdentitySetRoot = rooted("v138-plan-262-138-native-identity-set-v8", nativeIdentities)
  const mappingBody = Object.freeze({ mode, ordinal,
    genuineCustodyDomain: "plan133-path-dependent-native-root-v5-verified",
    nativeIdentities: structuredClone(nativeIdentities), stableNativeIdentitySetRoot })
  const nativeCustodyMapping = Object.freeze({ ...mappingBody,
    mappingRoot: rooted("v138-plan-262-138-genuine-to-stable-mapping-v8", mappingBody) })
  const gitRoot = rooted("v138-plan-262-138-disposable-git-object-v8", { mode, ordinal,
    subjectCommit: LIVE_SUBJECT, stableNativeIdentitySetRoot, mappingRoot: nativeCustodyMapping.mappingRoot })
  const nativeRoot = rooted("v138-plan-262-138-disposable-native-sources-v8", { mode, ordinal,
    stableNativeIdentitySetRoot, mappingRoot: nativeCustodyMapping.mappingRoot })
  const executionRoot = rooted("v138-plan-262-138-disposable-execution-closure-v8", {
    reviewedClosureRoot: item.disposableReviewedClosureRoot,
    installedClosureRoot: item.disposableLocalInstalledClosureRoot, gitRoot, nativeRoot,
    mappingRoot: nativeCustodyMapping.mappingRoot, mode, ordinal, status, reducedValue: item.reducedValue })
  const body = Object.freeze({ mode, status, ordinal, producerGuardCount: item.producerGuardCount,
    reducedValue: structuredClone(item.reducedValue),
    disposableReviewedClosureRoot: item.disposableReviewedClosureRoot,
    disposableLocalInstalledClosureRoot: item.disposableLocalInstalledClosureRoot,
    disposableLocalGitObjectRoot: gitRoot, disposableLocalNativeSourcesRoot: nativeRoot,
    disposableLocalNativeSourcePaths: nativeIdentities.map(({ path: repoPath }) => repoPath),
    disposableLocalExecutionClosureRoot: executionRoot, nativeCustodyMapping })
  return Object.freeze({ ...body,
    observationRoot: rooted("v138-plan-262-138-mode-observation-v8", body) })
}

const validateMappedObservation = (item: unknown, ordinal: number): void => {
  exactKeys(item, ["disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
    "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcePaths",
    "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode", "nativeCustodyMapping",
    "observationRoot", "ordinal", "producerGuardCount", "reducedValue", "status"],
  "V138_PLAN138_OBSERVATION_SCHEMA_INVALID")
  const [mode, status] = MODES[ordinal] ?? fail("V138_PLAN138_OBSERVATION_COUNT_INVALID")
  if (item.mode !== mode || item.status !== status || item.ordinal !== ordinal)
    fail("V138_PLAN138_OBSERVATION_ORDER_INVALID")
  validateReduced(item, ordinal)
  exactKeys(item.nativeCustodyMapping, ["genuineCustodyDomain", "mappingRoot", "mode",
    "nativeIdentities", "ordinal", "stableNativeIdentitySetRoot"],
  "V138_PLAN138_MAPPING_SCHEMA_INVALID")
  const mapping = item.nativeCustodyMapping
  if (mapping.mode !== mode || mapping.ordinal !== ordinal ||
      mapping.genuineCustodyDomain !== "plan133-path-dependent-native-root-v5-verified" ||
      canonical(mapping.nativeIdentities) !== canonical(NATIVE_IDENTITIES))
    fail("V138_PLAN138_MAPPING_BIJECTION_INVALID")
  const stableRoot = rooted("v138-plan-262-138-native-identity-set-v8", NATIVE_IDENTITIES)
  const { mappingRoot, ...mappingBody } = mapping
  if (mapping.stableNativeIdentitySetRoot !== stableRoot ||
      mappingRoot !== rooted("v138-plan-262-138-genuine-to-stable-mapping-v8", mappingBody))
    fail("V138_PLAN138_MAPPING_ROOT_INVALID")
  const expectedGit = rooted("v138-plan-262-138-disposable-git-object-v8", { mode, ordinal,
    subjectCommit: LIVE_SUBJECT, stableNativeIdentitySetRoot: stableRoot, mappingRoot })
  const expectedNative = rooted("v138-plan-262-138-disposable-native-sources-v8", { mode, ordinal,
    stableNativeIdentitySetRoot: stableRoot, mappingRoot })
  const expectedExecution = rooted("v138-plan-262-138-disposable-execution-closure-v8", {
    reviewedClosureRoot: item.disposableReviewedClosureRoot,
    installedClosureRoot: item.disposableLocalInstalledClosureRoot, gitRoot: expectedGit,
    nativeRoot: expectedNative, mappingRoot, mode, ordinal, status, reducedValue: item.reducedValue })
  if (canonical(item.disposableLocalNativeSourcePaths) !== canonical(NATIVE_IDENTITIES.map(({ path: p }) => p)) ||
      item.disposableLocalGitObjectRoot !== expectedGit ||
      item.disposableLocalNativeSourcesRoot !== expectedNative ||
      item.disposableLocalExecutionClosureRoot !== expectedExecution)
    fail("V138_PLAN138_OBSERVATION_STABLE_ROOT_INVALID")
  const { observationRoot, ...body } = item
  if (observationRoot !== rooted("v138-plan-262-138-mode-observation-v8", body))
    fail("V138_PLAN138_OBSERVATION_ROOT_INVALID")
}

export const rootV138Plan138PayloadForReview = (payload: Json): Sha => {
  const { payloadRoot: _ignored, ...body } = payload
  return rooted("v138-plan-262-138-live-v13-custody-payload-v8", body)
}
export const shaV138Plan138PayloadForReview = (payload: Json): Sha => sha(Buffer.from(canonical(payload)))
export const rootV138Plan138CarrierForReview = (carrier: Json): Sha => {
  const { carrierRoot: _ignored, ...body } = carrier
  return rooted("v138-plan-262-138-live-v13-custody-carrier-v8", body)
}

export const buildV138Plan138ProspectiveV8ForReview = (rootInput: string) => {
  let root: string
  try { root = realpathSync(path.resolve(rootInput)) } catch { fail("V138_PLAN138_ROOT_INVALID") }
  for (const repoPath of EFFECT_PATHS) if (existsSync(target(root, repoPath)))
    fail(`V138_PLAN138_EFFECT_PRESENT:${repoPath}`)
  const history = authenticateHistory(root)
  const nativeIdentities = authenticateNativeIdentities(root, history.head)
  const genuine = executeV138Plan133DisposableObservationsForReview(root)
  if (genuine.findings.length !== 0 || genuine.actualModesPassed !== 6 ||
      genuine.observations.length !== 6 || genuine.producerCalls !== 0 ||
      genuine.readinessInvoked !== false || genuine.liveInvoked !== false)
    fail("V138_PLAN138_GENUINE_BATCH_INVALID")
  const observations = genuine.observations.map((item, ordinal) =>
    mapGenuineObservation(item as Json, ordinal, nativeIdentities))
  for (const [ordinal, item] of observations.entries()) validateMappedObservation(item, ordinal)
  const body: Json = {
    schemaVersion: "v1.38-plan-262-138-live-v13-custody-payload-v8",
    protocol: "source-only-genuine-to-stable-native-custody-v8", sourceOnly: true,
    liveSubject: LIVE_SUBJECT, plan136SourceCommit: PLAN136.sourceCommit,
    plan136SummaryCommit: PLAN136.summaryCommit, plan136TrackingCommit: PLAN136.trackingCommit,
    plan136ReviewCommit: PLAN136.reviewCommit, plan136ReviewSha256: PLAN136.reviewSha,
    plan136Disposition: "process_invalid_genuine_to_stable_native_mapping",
    plan137Eligible: false, plan139Eligible: true, plan110Eligible: false,
    findingCount: 0, actualModesPassed: 6, nativeIdentitySet: nativeIdentities,
    stableNativeIdentitySetRoot: rooted("v138-plan-262-138-native-identity-set-v8", nativeIdentities),
    observations, observationsRoot: rooted("v138-plan-262-138-observations-v8", observations),
    requiredAccepted: 540, freshAccepted: 0, freshCharged: 0, producerCalls: 0,
    readinessInvoked: false, liveInvoked: false, downstreamAuthority: "denied",
    counters: Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0])),
    ...Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false])),
  }
  const payload = Object.freeze({ ...body,
    payloadRoot: rooted("v138-plan-262-138-live-v13-custody-payload-v8", body) })
  const carrierBody: Json = {
    schemaVersion: "v1.38-plan-262-138-live-v13-custody-carrier-v8",
    protocol: "nonpublishing-source-only-carrier-v8", sourceOnly: true,
    payloadMode: "100644", payloadRoot: payload.payloadRoot,
    payloadSha256: sha(Buffer.from(canonical(payload))), reviewMode: "100644",
    reviewSha256: sha(history.reviewBytes), findingCount: 0, actualModesPassed: 6,
    plan136Disposition: body.plan136Disposition, plan137Eligible: false, plan139Eligible: true,
    plan110Eligible: false, requiredAccepted: 540, freshAccepted: 0, freshCharged: 0,
    producerCalls: 0, readinessInvoked: false, liveInvoked: false, downstreamAuthority: "denied",
    authorizesExecution: false, createsCapacity: false, resetsCounters: false,
    authorizationLiteralCreated: false,
  }
  const carrier = Object.freeze({ ...carrierBody,
    carrierRoot: rooted("v138-plan-262-138-live-v13-custody-carrier-v8", carrierBody) })
  return structuredClone(Object.freeze({ payload, carrier, reviewBytes: Uint8Array.from(history.reviewBytes) }))
}

const validateNoAuthority = (item: Json, code: string): void => {
  if (item.plan110Eligible !== false || item.authorizesExecution !== false ||
      item.createsCapacity !== false || item.resetsCounters !== false ||
      item.authorizationLiteralCreated !== false || item.producerCalls !== 0 ||
      item.readinessInvoked !== false || item.liveInvoked !== false || item.freshCharged !== 0 ||
      item.freshAccepted !== 0 || item.requiredAccepted !== 540 || item.downstreamAuthority !== "denied") fail(code)
}
const validateAgainstFresh = (input: unknown, expected: unknown) => {
  exactKeys(input, ["carrier", "payload", "reviewBytes"], "V138_PLAN138_EVIDENCE_SCHEMA_INVALID")
  if (!(input.reviewBytes instanceof Uint8Array)) fail("V138_PLAN138_REVIEW_BYTES_INVALID")
  const payload = input.payload; const carrier = input.carrier
  if (!isObject(payload) || payload.schemaVersion !== "v1.38-plan-262-138-live-v13-custody-payload-v8" ||
      payload.protocol !== "source-only-genuine-to-stable-native-custody-v8" || payload.sourceOnly !== true ||
      payload.plan136Disposition !== "process_invalid_genuine_to_stable_native_mapping" ||
      payload.plan137Eligible !== false || payload.plan139Eligible !== true || payload.findingCount !== 0 ||
      payload.actualModesPassed !== 6 || canonical(payload.nativeIdentitySet) !== canonical(NATIVE_IDENTITIES) ||
      payload.stableNativeIdentitySetRoot !== rooted("v138-plan-262-138-native-identity-set-v8", NATIVE_IDENTITIES))
    fail("V138_PLAN138_PAYLOAD_SEMANTICS_INVALID")
  validateNoAuthority(payload, "V138_PLAN138_PAYLOAD_AUTHORITY_INVALID")
  for (const key of AUTHORITY_KEYS) if (payload[key] !== false) fail("V138_PLAN138_PAYLOAD_AUTHORITY_INVALID")
  exactKeys(payload.counters, COUNTER_KEYS, "V138_PLAN138_COUNTER_SCHEMA_INVALID")
  if (!Object.values(payload.counters).every((value) => value === 0))
    fail("V138_PLAN138_COUNTER_SEMANTICS_INVALID")
  if (!Array.isArray(payload.observations) || payload.observations.length !== 6)
    fail("V138_PLAN138_OBSERVATION_COUNT_INVALID")
  const seen = new Set<string>()
  for (const [ordinal, item] of payload.observations.entries()) {
    validateMappedObservation(item, ordinal)
    const key = `${item.mode}:${item.ordinal}`
    if (seen.has(key)) fail("V138_PLAN138_MAPPING_BIJECTION_INVALID"); seen.add(key)
  }
  if (seen.size !== 6 || payload.observationsRoot !==
      rooted("v138-plan-262-138-observations-v8", payload.observations) ||
      payload.payloadRoot !== rootV138Plan138PayloadForReview(payload))
    fail("V138_PLAN138_PAYLOAD_ROOT_INVALID")
  if (!isObject(carrier) || carrier.schemaVersion !== "v1.38-plan-262-138-live-v13-custody-carrier-v8" ||
      carrier.protocol !== "nonpublishing-source-only-carrier-v8" || carrier.sourceOnly !== true ||
      carrier.plan137Eligible !== false || carrier.plan139Eligible !== true || carrier.payloadMode !== "100644" ||
      carrier.reviewMode !== "100644" || carrier.findingCount !== 0 || carrier.actualModesPassed !== 6)
    fail("V138_PLAN138_CARRIER_SEMANTICS_INVALID")
  validateNoAuthority(carrier, "V138_PLAN138_CARRIER_AUTHORITY_INVALID")
  if (carrier.payloadRoot !== payload.payloadRoot ||
      carrier.payloadSha256 !== shaV138Plan138PayloadForReview(payload) ||
      carrier.reviewSha256 !== sha(input.reviewBytes) ||
      carrier.carrierRoot !== rootV138Plan138CarrierForReview(carrier))
    fail("V138_PLAN138_CARRIER_ROOT_INVALID")
  if (canonical(input) !== canonical(expected)) fail("V138_PLAN138_AUTHENTICATED_BYTES_MISMATCH")
  return Object.freeze({ sourceOnly: true as const, plan136Disposition: payload.plan136Disposition,
    plan137Eligible: false as const, plan139Eligible: true as const, plan110Eligible: false as const,
    authorizesExecution: false as const, createsCapacity: false as const, resetsCounters: false as const,
    authorizationLiteralCreated: false as const, producerCalls: 0 as const,
    readinessInvoked: false as const, liveInvoked: false as const, freshCharged: 0 as const,
    freshAccepted: 0 as const, requiredAccepted: 540 as const, downstreamAuthority: "denied" as const,
    stableNativeIdentitySetRoot: payload.stableNativeIdentitySetRoot,
    observationsRoot: payload.observationsRoot, payloadRoot: payload.payloadRoot,
    carrierRoot: carrier.carrierRoot })
}

export const authenticateV138Plan138ProspectiveV8ForReview = (input: unknown, rootInput: string) =>
  validateAgainstFresh(input, buildV138Plan138ProspectiveV8ForReview(rootInput))
export const authenticateV138Plan138ProspectiveV8BatchForReview =
  (inputs: readonly unknown[], rootInput: string) => {
    if (!Array.isArray(inputs) || inputs.length === 0 || inputs.length > 256)
      fail("V138_PLAN138_BATCH_SCHEMA_INVALID")
    const expected = buildV138Plan138ProspectiveV8ForReview(rootInput)
    return Object.freeze(inputs.map((input) => {
      try { validateAgainstFresh(input, expected); return Object.freeze({ accepted: true as const }) }
      catch (error) { return Object.freeze({ accepted: false as const,
        code: error instanceof Error ? error.message : String(error) }) }
    }))
  }
export const checkV138Plan138SourceOnlyForReview = (rootInput: string) => {
  const fresh = buildV138Plan138ProspectiveV8ForReview(rootInput)
  return validateAgainstFresh(fresh, fresh)
}

const execute = (args: readonly string[]): void => {
  const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length === 1 && args[0] === "--check-source-only") {
    process.stdout.write(`${JSON.stringify(checkV138Plan138SourceOnlyForReview(ownRoot))}\n`); return
  }
  if (args.length === 2 && args[0] === "--emit-prospective") {
    process.stdout.write(canonical(buildV138Plan138ProspectiveV8ForReview(args[1]!))); return
  }
  fail("V138_PLAN138_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
