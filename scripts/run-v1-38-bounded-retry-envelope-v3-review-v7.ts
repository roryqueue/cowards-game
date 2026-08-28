import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_PATHS,
  V138_BOUNDED_RETRY_V3_POLICY,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
  createV138InactiveRetryV3Envelope,
  encodeV138RetryV3CanonicalJson,
  requireV138RetryV3DestinationAbsent,
  type V138InactiveRetryV3Envelope,
  type V138RetrySha256,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"
import {
  V138_PLAN_262_102_SOURCE_PATHS,
  V138_PLAN_262_103_CANDIDATE_PATH,
  V138_PLAN_262_103_CARRIER_PATH,
  V138_PLAN_262_103_REPORT_PATH,
  computeV138Plan262103CandidatePayloadRoot,
  computeV138Plan262103CarrierRoot,
  computeV138Plan262103ReviewRoot,
  validateV138Plan262103Candidate,
  validateV138Plan262103Carrier,
} from "./lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.js"
import { authenticateV138CommittedRegularFile } from "./run-v1-38-bounded-retry-envelope-v3.js"
import { computeV138Plan262103ConsumerObservationRoot } from "./run-v1-38-bounded-retry-envelope-v3-review-v6.js"

const canonical = encodeV138RetryV3CanonicalJson
const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: Uint8Array | string): V138RetrySha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const gitBlob = (bytes: Buffer): string =>
  createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex")

const SOURCE_COMMIT = "332aae093ef6e26c95a18f21cfd253ccc829ce48"
const CANDIDATE_BLOB = "2d3f995bcd4c0067e3d8c0c2a0120a36bfdc1745"
const REVIEW_BLOB = "680616684dcdc408829923bf9f062a075ddf32f2"
const EXPECTED_PUBLICATION = "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c"
const PAIR_INTENT = ".planning/artifacts/v1.38-v3-seal-envelope-v7.intent"
const LOCAL_SEAL_PATH =
  ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json"
const TRIO_PATHS = Object.freeze([
  V138_PLAN_262_103_CANDIDATE_PATH,
  V138_PLAN_262_103_REPORT_PATH,
  V138_PLAN_262_103_CARRIER_PATH,
] as const)

export const V138_PLAN_262_104_MODES = Object.freeze([
  "--check-source-only",
  "--derive-seal-envelope-no-publish",
  "--publish-sealed-inactive-envelope",
  "--check-sealed-inactive-envelope",
] as const)

const downstreamDestinations = Object.freeze([
  V138_BOUNDED_RETRY_V3_PATHS.journal,
  `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
  V138_BOUNDED_RETRY_V3_PATHS.lock,
  V138_BOUNDED_RETRY_V3_PATHS.privateDir,
  V138_BOUNDED_RETRY_V3_PATHS.terminal,
  V138_BOUNDED_RETRY_V3_PATHS.reproduction,
  V138_BOUNDED_RETRY_V3_PATHS.receiptManifest,
  V138_BOUNDED_RETRY_V3_PATHS.disposition,
  V138_BOUNDED_RETRY_V3_PATHS.correction,
  V138_BOUNDED_RETRY_V3_PATHS.activation,
  V138_BOUNDED_RETRY_V3_PATHS.readiness,
  V138_BOUNDED_RETRY_V3_PATHS.lifecycle,
] as const)

const containedTarget = (repoRoot: string, repoPath: string): string => {
  if (path.isAbsolute(repoPath) || repoPath.includes("\0"))
    fail("V138_PLAN_262_104_PATH_INVALID")
  const root = path.resolve(repoRoot)
  const target = path.resolve(root, repoPath)
  if (target === root || !target.startsWith(`${root}${path.sep}`))
    fail("V138_PLAN_262_104_PATH_INVALID")
  return target
}

const readNoFollow = (repoRoot: string, repoPath: string): Buffer => {
  const target = containedTarget(repoRoot, repoPath)
  const before = lstatSync(target)
  if (!before.isFile() || before.isSymbolicLink())
    fail("V138_PLAN_262_104_CUSTODY_INVALID")
  const descriptor = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(descriptor)
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.size > 64 * 1024 * 1024
    )
      fail("V138_PLAN_262_104_CUSTODY_INVALID")
    return readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

const git = (repoRoot: string, args: readonly string[]): string =>
  runV138RetryV3IsolatedGit(repoRoot, args)

const requireAncestor = (
  repoRoot: string,
  ancestor: string,
  descendant: string,
): void => {
  try {
    git(repoRoot, ["merge-base", "--is-ancestor", ancestor, descendant])
  } catch {
    fail("V138_PLAN_262_104_TRIO_ANCESTRY_INVALID")
  }
}

type RawEntry = Readonly<{
  oldMode: string
  newMode: string
  oldBlob: string
  newBlob: string
  status: string
  repoPath: string
}>

const rawDiff = (repoRoot: string, commit: string): readonly RawEntry[] => {
  const output = git(repoRoot, [
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--raw",
    "-r",
    commit,
  ])
  if (output === "") return []
  return output.split("\n").map((line) => {
    const match = /^:([0-9]{6}) ([0-9]{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) ([A-Z][0-9]*)\t(.+)$/u.exec(line)
    if (match === null) fail("V138_PLAN_262_104_GIT_DIFF_INVALID")
    return Object.freeze({
      oldMode: match[1],
      newMode: match[2],
      oldBlob: match[3],
      newBlob: match[4],
      status: match[5],
      repoPath: match[6],
    })
  })
}

const exactIntroduction = (
  entries: readonly RawEntry[],
  expected: Readonly<Record<string, string>>,
): boolean => {
  if (entries.length !== TRIO_PATHS.length) return false
  const byPath = new Map(entries.map((entry) => [entry.repoPath, entry]))
  return TRIO_PATHS.every((repoPath) => {
    const entry = byPath.get(repoPath)
    return (
      entry?.oldMode === "000000" &&
      entry.newMode === "100644" &&
      entry.oldBlob === "0".repeat(40) &&
      entry.newBlob === expected[repoPath] &&
      entry.status === "A"
    )
  })
}

const committedAndWorking = (
  repoRoot: string,
  commit: string,
  repoPath: string,
  expectedMode: "100644",
  expectedBlob: string,
): Buffer => {
  const committed = authenticateV138CommittedRegularFile(repoRoot, commit, repoPath)
  const working = readNoFollow(repoRoot, repoPath)
  if (
    committed.mode !== expectedMode ||
    committed.oid !== expectedBlob ||
    !committed.bytes.equals(working)
  )
    fail("V138_PLAN_262_104_CUSTODY_INVALID")
  return committed.bytes
}

export type V138Plan262103TrioPublication = Readonly<{
  sourceCommit: string
  publicationCommit: string
  headCommit: string
  candidate: Readonly<{ mode: "100644"; blob: string; bytes: Buffer }>
  review: Readonly<{ mode: "100644"; blob: string; bytes: Buffer }>
  carrier: Readonly<{ mode: "100644"; blob: string; bytes: Buffer }>
  candidateValue: Record<string, any>
  carrierValue: Record<string, any>
}>

export const resolveV138Plan262103TrioPublication = (
  repoRoot: string,
  headCommit = git(repoRoot, ["rev-parse", "HEAD"]),
): V138Plan262103TrioPublication => {
  const candidateBytes = readNoFollow(repoRoot, V138_PLAN_262_103_CANDIDATE_PATH)
  const reviewBytes = readNoFollow(repoRoot, V138_PLAN_262_103_REPORT_PATH)
  const carrierBytes = readNoFollow(repoRoot, V138_PLAN_262_103_CARRIER_PATH)
  const candidate = validateV138Plan262103Candidate(
    JSON.parse(candidateBytes.toString("utf8")),
  )
  const carrier = validateV138Plan262103Carrier(
    JSON.parse(carrierBytes.toString("utf8")),
  )
  if (
    !candidateBytes.equals(Buffer.from(canonical(candidate))) ||
    !carrierBytes.equals(Buffer.from(canonical(carrier))) ||
    candidate.correctedSource.commit !== SOURCE_COMMIT ||
    candidate.candidatePayloadRoot !== computeV138Plan262103CandidatePayloadRoot(candidate) ||
    carrier.carrierRoot !== computeV138Plan262103CarrierRoot(carrier) ||
    candidate.reviewRoot !== computeV138Plan262103ReviewRoot(reviewBytes) ||
    candidate.execution.actualConsumerObservationRoot !==
      computeV138Plan262103ConsumerObservationRoot() ||
    carrier.candidate.candidatePayloadRoot !== candidate.candidatePayloadRoot ||
    canonical(candidate.correctedSource) !== canonical(carrier.reviewedSource) ||
    canonical(candidate.protectedHistory) !== canonical(carrier.protectedHistory) ||
    canonical(candidate.findings) !== canonical(carrier.findings) ||
    candidate.findingCount !== carrier.findingCount ||
    candidate.sourceReviewPassed !== carrier.sourceReviewPassed ||
    canonical(candidate.authority) !== canonical(carrier.authority) ||
    carrier.actualConsumer.observationRoot !==
      candidate.execution.actualConsumerObservationRoot
  )
    fail("V138_PLAN_262_104_TRIO_CLOSURE_INVALID")

  const expectedCarrierBlob = gitBlob(Buffer.from(canonical(carrier)))
  const expectedBlobs: Readonly<Record<string, string>> = Object.freeze({
    [V138_PLAN_262_103_CANDIDATE_PATH]: CANDIDATE_BLOB,
    [V138_PLAN_262_103_REPORT_PATH]: REVIEW_BLOB,
    [V138_PLAN_262_103_CARRIER_PATH]: expectedCarrierBlob,
  })
  const history = git(repoRoot, ["log", "--format=%H", headCommit, "--", ...TRIO_PATHS])
    .split("\n")
    .filter(Boolean)
  const publications = history.filter((commit) =>
    exactIntroduction(rawDiff(repoRoot, commit), expectedBlobs),
  )
  if (publications.length !== 1)
    fail("V138_PLAN_262_104_TRIO_PUBLICATION_NOT_UNIQUE")
  const publicationCommit = publications[0]
  if (publicationCommit !== EXPECTED_PUBLICATION)
    fail("V138_PLAN_262_104_TRIO_PUBLICATION_INVALID")
  requireAncestor(repoRoot, SOURCE_COMMIT, publicationCommit)
  requireAncestor(repoRoot, publicationCommit, headCommit)
  const laterTrio = git(repoRoot, [
    "log",
    "--format=%H",
    `${publicationCommit}..${headCommit}`,
    "--",
    ...TRIO_PATHS,
  ])
  const laterSource = git(repoRoot, [
    "log",
    "--format=%H",
    `${SOURCE_COMMIT}..${headCommit}`,
    "--",
    ...V138_PLAN_262_102_SOURCE_PATHS,
  ])
  if (laterTrio !== "" || laterSource !== "")
    fail("V138_PLAN_262_104_TRIO_REWRITTEN")
  for (const expected of candidate.correctedSource.files) {
    const bytes = committedAndWorking(
      repoRoot,
      SOURCE_COMMIT,
      expected.path,
      "100644",
      expected.blob,
    )
    if (bytes.length !== expected.byteLength || sha256(bytes) !== expected.sha256)
      fail("V138_PLAN_262_104_SOURCE_CUSTODY_INVALID")
  }
  return Object.freeze({
    sourceCommit: SOURCE_COMMIT,
    publicationCommit,
    headCommit,
    candidate: Object.freeze({
      mode: "100644" as const,
      blob: CANDIDATE_BLOB,
      bytes: committedAndWorking(
        repoRoot,
        publicationCommit,
        V138_PLAN_262_103_CANDIDATE_PATH,
        "100644",
        CANDIDATE_BLOB,
      ),
    }),
    review: Object.freeze({
      mode: "100644" as const,
      blob: REVIEW_BLOB,
      bytes: committedAndWorking(
        repoRoot,
        publicationCommit,
        V138_PLAN_262_103_REPORT_PATH,
        "100644",
        REVIEW_BLOB,
      ),
    }),
    carrier: Object.freeze({
      mode: "100644" as const,
      blob: expectedCarrierBlob,
      bytes: committedAndWorking(
        repoRoot,
        publicationCommit,
        V138_PLAN_262_103_CARRIER_PATH,
        "100644",
        expectedCarrierBlob,
      ),
    }),
    candidateValue: candidate,
    carrierValue: carrier,
  })
}

export interface V138Plan262104Seal {
  readonly schemaVersion: "v1.38-successor-source-seal-v13"
  readonly sourceBaseCommit: string
  readonly researchCommit: string
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly directParentCommit: string
  readonly sourceRoot: V138RetrySha256
  readonly reviewRoot: V138RetrySha256
  readonly reviewCommit: string
  readonly localSealVerificationRoot: V138RetrySha256
  readonly protectedHistoryRoot: V138RetrySha256
  readonly directChild: true
  readonly assuranceClass: "single_operator_local_seal_v1"
  readonly productionAuthorized: false
  readonly downstreamAuthority: "denied"
  readonly sealRoot: V138RetrySha256
}

export type V138Plan262104Artifacts = Readonly<{
  seal: Readonly<V138Plan262104Seal>
  envelope: Readonly<V138InactiveRetryV3Envelope>
  publicationCommit: string
  directParentCommit: string
}>

const deriveArtifacts = (
  repoRoot: string,
  directParentCommit = git(repoRoot, ["rev-parse", "HEAD"]),
): V138Plan262104Artifacts => {
  const trio = resolveV138Plan262103TrioPublication(repoRoot, directParentCommit)
  const localSeal = JSON.parse(
    readNoFollow(repoRoot, LOCAL_SEAL_PATH).toString("utf8"),
  ) as Record<string, unknown>
  if (
    localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true ||
    localSeal.independentCustodyClaimed !== false ||
    typeof localSeal.verificationRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(localSeal.verificationRoot)
  )
    fail("V138_PLAN_262_104_LOCAL_SEAL_INVALID")
  const closure = authenticateV138RetryV3ExecutionClosure(repoRoot, {
    sourceCommit: trio.sourceCommit,
    checkoutPaths: V138_PLAN_262_102_SOURCE_PATHS,
  })
  for (const key of [
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
    "pathnameLaunchReplacementResistanceClaimed",
  ] as const)
    if (closure[key] !== trio.candidateValue.reviewedExecutionClosure[key])
      fail("V138_PLAN_262_104_EXECUTION_CLOSURE_MISMATCH")
  // The reviewed closure root is portable, while the native helper's local
  // root includes absolute source paths. Authenticating the complete current
  // closure above revalidates those native source bytes without equating two
  // checkout-specific path identities.
  const sourceRoot = sha256(
    canonical(
      V138_PLAN_262_102_SOURCE_PATHS.map((repoPath) => ({
        repoPath,
        sha256: sha256(readNoFollow(repoRoot, repoPath)),
      })),
    ),
  )
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v13" as const,
    sourceBaseCommit: V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.preResearchBaselineCommit,
    researchCommit: V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.researchCommit,
    sourceCommit: directParentCommit,
    sourceTree: git(repoRoot, ["rev-parse", `${directParentCommit}^{tree}`]),
    directParentCommit,
    sourceRoot,
    reviewRoot: trio.candidateValue.reviewRoot as V138RetrySha256,
    reviewCommit: trio.publicationCommit,
    localSealVerificationRoot: localSeal.verificationRoot as V138RetrySha256,
    protectedHistoryRoot: V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedHistoryRoot,
    directChild: true as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const seal = Object.freeze({
    ...body,
    sealRoot: sha256(`v138-successor-source-seal-v13\0${canonical(body)}`),
  })
  const envelope = createV138InactiveRetryV3Envelope({
    sourceRoot: seal.sourceRoot,
    reviewRoot: seal.reviewRoot,
    sealRoot: seal.sealRoot,
    protectedHistoryRoot: seal.protectedHistoryRoot,
    protectedHistoricalIdentities: V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedIdentities,
  })
  return Object.freeze({
    seal,
    envelope,
    publicationCommit: trio.publicationCommit,
    directParentCommit,
  })
}

export type V138Plan262104NoPublishResult =
  | Readonly<{
      kind: "eligible"
      status: "sealed_inactive_not_published"
      sealRoot: V138RetrySha256
      envelopeRoot: V138RetrySha256
      seal: Readonly<V138Plan262104Seal>
      envelope: Readonly<V138InactiveRetryV3Envelope>
      publicationCommit: string
      directParentCommit: string
      freshCharged: 0
      freshAccepted: 0
      downstreamAuthority: "denied"
    }>
  | Readonly<{
      kind: "ineligible_review"
      status: "blocked"
      findingCount: number
      freshCharged: 0
      freshAccepted: 0
      downstreamAuthority: "denied"
    }>
  | Readonly<{
      kind: "integrity_stop"
      status: "integrity_stop"
      reason: string
      freshCharged: 0
      freshAccepted: 0
      downstreamAuthority: "denied"
    }>

export const deriveV138Plan262104SealEnvelopeNoPublish = (
  repoRoot: string,
): V138Plan262104NoPublishResult => {
  try {
    const trio = resolveV138Plan262103TrioPublication(repoRoot)
    if (
      trio.candidateValue.status === "blocked" ||
      trio.candidateValue.findingCount !== 0 ||
      trio.candidateValue.sourceReviewPassed !== true ||
      trio.carrierValue.actualConsumer.status !== "passed" ||
      trio.carrierValue.authority.plan26292Eligible !== true
    )
      return Object.freeze({
        kind: "ineligible_review",
        status: "blocked",
        findingCount: trio.candidateValue.findingCount,
        freshCharged: 0,
        freshAccepted: 0,
        downstreamAuthority: "denied",
      })
    const artifacts = deriveArtifacts(repoRoot, trio.headCommit)
    return Object.freeze({
      kind: "eligible",
      status: "sealed_inactive_not_published",
      sealRoot: artifacts.seal.sealRoot,
      envelopeRoot: artifacts.envelope.envelopeRoot,
      ...artifacts,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  } catch (error) {
    return Object.freeze({
      kind: "integrity_stop",
      status: "integrity_stop",
      reason: error instanceof Error ? error.message : "V138_PLAN_262_104_INTEGRITY_STOP",
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  }
}

const requirePolicyAndAbsence = (repoRoot: string): void => {
  if (
    V138_BOUNDED_RETRY_V3_POLICY.maximumRouteStarts !== 3 ||
    V138_BOUNDED_RETRY_V3_POLICY.maximumPreflightObservations !== 12 ||
    V138_BOUNDED_RETRY_V3_POLICY.envelopeLifetimeMilliseconds !== 14_400_000 ||
    V138_BOUNDED_RETRY_V3_POLICY.refusalSpacingMilliseconds !== 300_000 ||
    V138_BOUNDED_RETRY_V3_POLICY.calibrationFailureBackoffMilliseconds !== 900_000 ||
    V138_BOUNDED_RETRY_V3_POLICY.calibrationAttemptsPerRoute !== 8 ||
    V138_BOUNDED_RETRY_V3_POLICY.calibrationShardCount !== 4 ||
    V138_BOUNDED_RETRY_V3_POLICY.samplingMilliseconds !== 200 ||
    V138_BOUNDED_RETRY_V3_POLICY.minimumEffectiveAvailableBasisPoints !== 2_500 ||
    V138_BOUNDED_RETRY_V3_POLICY.reproductionCellCount !== 540 ||
    V138_BOUNDED_RETRY_V3_POLICY.rulesAuthority !== "MATCH_KERNEL" ||
    V138_BOUNDED_RETRY_V3_POLICY.supervisedRuntimeOnly !== true ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.routes.length !== 3 ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.preflights.length !== 12 ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.length !== 24 ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction.length !== 540
  )
    fail("V138_PLAN_262_104_FROZEN_V3_CONTRACT_INVALID")
  const absent = [
    V138_BOUNDED_RETRY_V3_PATHS.seal,
    V138_BOUNDED_RETRY_V3_PATHS.envelope,
    PAIR_INTENT,
    ...downstreamDestinations,
  ]
  for (const target of absent)
    try {
      requireV138RetryV3DestinationAbsent(repoRoot, target)
    } catch {
      fail("V138_PLAN_262_104_DESTINATION_PRESENT")
    }
}

export interface V138Plan262104CliDependencies {
  readonly repoRoot: string
  readonly writeOutput: (value: string) => void
}

export const executeV138Plan262104Cli = async (
  argv: readonly string[],
  injected?: Partial<V138Plan262104CliDependencies>,
): Promise<void> => {
  const repoRoot =
    injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const writeOutput = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  if (argv.length !== 1 || !V138_PLAN_262_104_MODES.includes(argv[0] as never))
    fail("V138_PLAN_262_104_ARGUMENTS_INVALID")
  const command = argv[0]
  if (command === "--check-source-only") {
    requirePolicyAndAbsence(repoRoot)
    const trio = resolveV138Plan262103TrioPublication(repoRoot)
    writeOutput(
      `${JSON.stringify({ status: "passed", publicationCommit: trio.publicationCommit, liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied" })}\n`,
    )
    return
  }
  if (command === "--derive-seal-envelope-no-publish") {
    requirePolicyAndAbsence(repoRoot)
    const result = deriveV138Plan262104SealEnvelopeNoPublish(repoRoot)
    writeOutput(`${JSON.stringify(result)}\n`)
    if (result.kind === "integrity_stop") fail(result.reason)
    return
  }
  fail("V138_PLAN_262_104_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  executeV138Plan262104Cli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V138_PLAN_262_104_FAILED"}\n`,
    )
    process.exitCode = 1
  })
}
