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
  V138_BOUNDED_RETRY_V3_POLICY,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
  createV138InactiveRetryV3Envelope,
  encodeV138RetryV3CanonicalJson,
  requireV138RetryV3DestinationAbsent,
  type V138RetrySha256,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"
import {
  V138_BOUNDED_RETRY_V3_PATHS,
  authenticateV138CommittedRegularFile,
} from "./run-v1-38-bounded-retry-envelope-v3.js"
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

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const canonical = encodeV138RetryV3CanonicalJson
const sha256 = (value: Uint8Array | string): V138RetrySha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const fail = (code: string): never => {
  throw new TypeError(code)
}

export const V138_PLAN_262_103_FORBIDDEN_DESTINATIONS = Object.freeze([
  V138_PLAN_262_103_CANDIDATE_PATH,
  V138_PLAN_262_103_REPORT_PATH,
  V138_PLAN_262_103_CARRIER_PATH,
  V138_BOUNDED_RETRY_V3_PATHS.seal,
  V138_BOUNDED_RETRY_V3_PATHS.envelope,
  V138_BOUNDED_RETRY_V3_PATHS.journal,
  `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
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

export const V138_PLAN_262_103_OBSERVATION_DOMAIN =
  "v1.38:plan-262-103:actual-final-consumer-observation:v1" as const

export const computeV138Plan262103ConsumerObservationRoot =
  (): V138RetrySha256 =>
    sha256(
      Buffer.concat([
        Buffer.from(V138_PLAN_262_103_OBSERVATION_DOMAIN),
        Buffer.from([0]),
        Buffer.from(
          canonical({
            policy: {
              maximumRouteStarts: V138_BOUNDED_RETRY_V3_POLICY.maximumRouteStarts,
              maximumPreflightObservations:
                V138_BOUNDED_RETRY_V3_POLICY.maximumPreflightObservations,
              envelopeLifetimeMilliseconds:
                V138_BOUNDED_RETRY_V3_POLICY.envelopeLifetimeMilliseconds,
              refusalSpacingMilliseconds:
                V138_BOUNDED_RETRY_V3_POLICY.refusalSpacingMilliseconds,
              calibrationFailureBackoffMilliseconds:
                V138_BOUNDED_RETRY_V3_POLICY.calibrationFailureBackoffMilliseconds,
              calibrationAttemptsPerRoute:
                V138_BOUNDED_RETRY_V3_POLICY.calibrationAttemptsPerRoute,
              calibrationShardCount:
                V138_BOUNDED_RETRY_V3_POLICY.calibrationShardCount,
              samplingMilliseconds: V138_BOUNDED_RETRY_V3_POLICY.samplingMilliseconds,
              minimumEffectiveAvailableBasisPoints:
                V138_BOUNDED_RETRY_V3_POLICY.minimumEffectiveAvailableBasisPoints,
              reproductionCellCount:
                V138_BOUNDED_RETRY_V3_POLICY.reproductionCellCount,
              maximumReproductionRuns:
                V138_BOUNDED_RETRY_V3_POLICY.maximumReproductionRuns,
              rulesAuthority: V138_BOUNDED_RETRY_V3_POLICY.rulesAuthority,
              supervisedRuntimeOnly:
                V138_BOUNDED_RETRY_V3_POLICY.supervisedRuntimeOnly,
              assuranceClass: V138_BOUNDED_RETRY_V3_POLICY.assuranceClass,
            },
            counts: {
              routes: V138_BOUNDED_RETRY_V3_IDENTITIES.routes.length,
              preflights: V138_BOUNDED_RETRY_V3_IDENTITIES.preflights.length,
              calibrations: V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.length,
              reproduction: V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction.length,
            },
            canonicalWrites: 0,
            liveInvoked: false,
            freshCharged: 0,
            freshAccepted: 0,
            downstreamAuthority: "denied",
          }),
        ),
      ]),
    )

const containedTarget = (repoRoot: string, repoPath: string): string => {
  if (path.isAbsolute(repoPath) || repoPath.includes("\0"))
    fail("V138_PLAN_262_103_CUSTODY_INVALID")
  const resolvedRoot = path.resolve(repoRoot)
  const target = path.resolve(resolvedRoot, repoPath)
  if (target === resolvedRoot || !target.startsWith(`${resolvedRoot}${path.sep}`))
    fail("V138_PLAN_262_103_CUSTODY_INVALID")
  return target
}

const readNoFollow = (repoRoot: string, repoPath: string): Buffer => {
  const target = containedTarget(repoRoot, repoPath)
  const before = lstatSync(target)
  if (!before.isFile() || before.isSymbolicLink())
    fail("V138_PLAN_262_103_CUSTODY_INVALID")
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(fd)
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.size > 64 * 1024 * 1024
    )
      fail("V138_PLAN_262_103_CUSTODY_INVALID")
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}

const authenticateFileRecord = (
  repoRoot: string,
  commit: string,
  expected: Record<string, any>,
): Buffer => {
  const actual = authenticateV138CommittedRegularFile(repoRoot, commit, expected.path)
  const working = readNoFollow(repoRoot, expected.path)
  if (
    actual.mode !== expected.mode ||
    actual.oid !== (expected.blobOid ?? expected.blob) ||
    actual.byteLength !== expected.byteLength ||
    sha256(actual.bytes) !== expected.sha256 ||
    !actual.bytes.equals(working)
  )
    fail("V138_PLAN_262_103_CUSTODY_INVALID")
  return actual.bytes
}

const sameCanonical = (left: unknown, right: unknown): boolean =>
  canonical(left) === canonical(right)

export type V138Plan262103NoPublishResult =
  | Readonly<{
      kind: "eligible"
      status: "sealed_inactive_not_published"
      sealRoot: V138RetrySha256
      envelopeRoot: V138RetrySha256
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

export const consumeV138Plan262103ReviewNoPublish = (args: {
  readonly candidate: unknown
  readonly carrier: unknown
  readonly reportBytes: Buffer
  readonly authenticateCustody: (
    candidate: Record<string, any>,
    carrier: Record<string, any>,
    reportBytes: Buffer,
  ) => void
  readonly deriveFrozenArtifacts: () => Readonly<{
    sealRoot: V138RetrySha256
    envelopeRoot: V138RetrySha256
  }>
}): V138Plan262103NoPublishResult => {
  try {
    const candidate = validateV138Plan262103Candidate(args.candidate)
    const carrier = validateV138Plan262103Carrier(args.carrier)
    if (
      !sameCanonical(candidate.correctedSource, carrier.reviewedSource) ||
      !sameCanonical(candidate.protectedHistory, carrier.protectedHistory) ||
      !sameCanonical(candidate.findings, carrier.findings) ||
      candidate.findingCount !== carrier.findingCount ||
      candidate.sourceReviewPassed !== carrier.sourceReviewPassed ||
      !sameCanonical(candidate.authority, carrier.authority) ||
      carrier.candidate.candidatePayloadRoot !== candidate.candidatePayloadRoot ||
      carrier.actualConsumer.observationRoot !==
        candidate.execution.actualConsumerObservationRoot
    )
      fail("V138_PLAN_262_103_REVIEW_CORRELATION_INVALID")
    args.authenticateCustody(candidate, carrier, args.reportBytes)
    if (candidate.status === "blocked")
      return Object.freeze({
        kind: "ineligible_review",
        status: "blocked",
        findingCount: candidate.findingCount,
        freshCharged: 0,
        freshAccepted: 0,
        downstreamAuthority: "denied",
      })
    const artifacts = args.deriveFrozenArtifacts()
    return Object.freeze({
      kind: "eligible",
      status: "sealed_inactive_not_published",
      sealRoot: artifacts.sealRoot,
      envelopeRoot: artifacts.envelopeRoot,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  } catch (error) {
    return Object.freeze({
      kind: "integrity_stop",
      status: "integrity_stop",
      reason: error instanceof Error ? error.message : "V138_PLAN_262_103_INTEGRITY_STOP",
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  }
}

const authenticateRepositoryReview = (
  repoRoot: string,
  pairCommit: string,
  candidate: Record<string, any>,
  carrier: Record<string, any>,
  reportBytes: Buffer,
): void => {
  if (
    runV138RetryV3IsolatedGit(repoRoot, ["show", "-s", "--format=%P", pairCommit]) !==
    candidate.correctedSource.commit
  )
    fail("V138_PLAN_262_103_PAIR_LINEAGE_INVALID")
  for (const expected of candidate.correctedSource.files)
    authenticateFileRecord(repoRoot, candidate.correctedSource.commit, expected)
  const candidateBytes = authenticateFileRecord(repoRoot, pairCommit, carrier.candidate)
  const committedReportBytes = authenticateFileRecord(repoRoot, pairCommit, carrier.review)
  const committedCarrier = authenticateV138CommittedRegularFile(
    repoRoot,
    pairCommit,
    V138_PLAN_262_103_CARRIER_PATH,
  )
  const workingCarrierBytes = readNoFollow(repoRoot, V138_PLAN_262_103_CARRIER_PATH)
  if (
    !candidateBytes.equals(Buffer.from(canonical(candidate))) ||
    !committedReportBytes.equals(reportBytes) ||
    !["100644", "100755"].includes(committedCarrier.mode) ||
    !committedCarrier.bytes.equals(workingCarrierBytes) ||
    !committedCarrier.bytes.equals(Buffer.from(canonical(carrier))) ||
    carrier.candidate.candidatePayloadRoot !==
      computeV138Plan262103CandidatePayloadRoot(candidate) ||
    carrier.carrierRoot !== computeV138Plan262103CarrierRoot(carrier) ||
    candidate.reviewRoot !== computeV138Plan262103ReviewRoot(reportBytes) ||
    candidate.execution.actualConsumerObservationRoot !==
      computeV138Plan262103ConsumerObservationRoot()
  )
    fail("V138_PLAN_262_103_CUSTODY_INVALID")
  const closure = authenticateV138RetryV3ExecutionClosure(repoRoot, {
    sourceCommit: candidate.correctedSource.commit,
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
    "nativeSourcesRoot",
    "pathnameLaunchReplacementResistanceClaimed",
  ] as const)
    if (closure[key] !== candidate.reviewedExecutionClosure[key])
      fail("V138_PLAN_262_103_EXECUTION_CLOSURE_MISMATCH")
}

const deriveFrozenV3Artifacts = (
  repoRoot: string,
  pairCommit: string,
  candidate: Record<string, any>,
): Readonly<{ sealRoot: V138RetrySha256; envelopeRoot: V138RetrySha256 }> => {
  const localSeal = JSON.parse(
    readNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.localSeal).toString("utf8"),
  ) as Record<string, unknown>
  if (
    localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true ||
    localSeal.independentCustodyClaimed !== false ||
    typeof localSeal.verificationRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(localSeal.verificationRoot)
  )
    fail("V138_PLAN_262_103_LOCAL_SEAL_INVALID")
  const sourceBytes = V138_PLAN_262_102_SOURCE_PATHS.map((repoPath) => ({
    repoPath,
    sha256: sha256(readNoFollow(repoRoot, repoPath)),
  }))
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v13" as const,
    sourceBaseCommit:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.preResearchBaselineCommit,
    researchCommit: V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.researchCommit,
    sourceCommit: pairCommit,
    sourceTree: runV138RetryV3IsolatedGit(repoRoot, [
      "rev-parse",
      `${pairCommit}^{tree}`,
    ]),
    directParentCommit: pairCommit,
    sourceRoot: sha256(canonical(sourceBytes)),
    reviewRoot: candidate.reviewRoot as V138RetrySha256,
    reviewCommit: pairCommit,
    localSealVerificationRoot: localSeal.verificationRoot as V138RetrySha256,
    protectedHistoryRoot:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedHistoryRoot,
    directChild: true as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const sealRoot = sha256(
    `v138-successor-source-seal-v13\0${canonical(body)}`,
  )
  const envelope = createV138InactiveRetryV3Envelope({
    sourceRoot: body.sourceRoot,
    reviewRoot: body.reviewRoot,
    sealRoot,
    protectedHistoryRoot: body.protectedHistoryRoot,
    protectedHistoricalIdentities:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedIdentities,
  })
  return Object.freeze({ sealRoot, envelopeRoot: envelope.envelopeRoot })
}

const assertSourceOnly = (repoRoot: string): void => {
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
    fail("V138_PLAN_262_103_FROZEN_V3_CONTRACT_INVALID")
  for (const target of V138_PLAN_262_103_FORBIDDEN_DESTINATIONS)
    try {
      requireV138RetryV3DestinationAbsent(repoRoot, target)
    } catch {
      fail("V138_PLAN_262_103_DESTINATION_PRESENT")
    }
  for (const [repoPath, expected] of [
    [
      `${PHASE_DIR}/262-100-SUMMARY.md`,
      "sha256:858b082ca74c8a77b380fc16d658b17cb8a30de823894161bd541feeb6bb0c2c",
    ],
    [
      ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
      "sha256:891776dee9f6e2b3f87a99d8199512bfa4207f9fe03ab63fd29d04ac1c142ee3",
    ],
    [
      `${PHASE_DIR}/262-101-REVIEW.md`,
      "sha256:14e750b89dc8bb30c080bd8fcc9a25fc7fe0d841367b3149c78b517a0d8f7f27",
    ],
    [
      `${PHASE_DIR}/262-101-SUMMARY.md`,
      "sha256:f1a4b96e3c2122e20dffd9fbab2b64ec976315e6655da51433bfb960cdb1f350",
    ],
  ] as const)
    if (sha256(readNoFollow(repoRoot, repoPath)) !== expected)
      fail("V138_PLAN_262_103_PROTECTED_HISTORY_INVALID")
}

export interface V138Plan262103CliDependencies {
  readonly repoRoot: string
  readonly assertSourceOnly: () => void
  readonly writeOutput: (value: string) => void
  readonly writeEvidence: (target: string, bytes: Buffer) => void
}

export const executeV138Plan262103ConsumerCli = async (
  argv: readonly string[],
  injected?: Partial<V138Plan262103CliDependencies>,
): Promise<void> => {
  const repoRoot =
    injected?.repoRoot ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const writeOutput = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  const command = argv[0]
  const rest = argv.slice(1)
  if (command === "--check-source-only" && rest.length === 0) {
    ;(injected?.assertSourceOnly ?? (() => assertSourceOnly(repoRoot)))()
    writeOutput(
      `${JSON.stringify({
        status: "passed",
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
        phase263Authorized: false,
        candidateSearchAuthorized: false,
        formationMaterializationAuthorized: false,
        holdoutOpeningAuthorized: false,
        publicAuthorized: false,
        productAuthorized: false,
        productionAuthorized: false,
        gameplayChangeAuthorized: false,
        downstreamAuthority: "denied",
      })}\n`,
    )
    return
  }
  if (command === "--derive-seal-envelope-no-publish" && rest.length === 0) {
    const pairCommit = runV138RetryV3IsolatedGit(repoRoot, ["rev-parse", "HEAD"])
    const candidateBytes = readNoFollow(repoRoot, V138_PLAN_262_103_CANDIDATE_PATH)
    const reportBytes = readNoFollow(repoRoot, V138_PLAN_262_103_REPORT_PATH)
    const carrierBytes = readNoFollow(repoRoot, V138_PLAN_262_103_CARRIER_PATH)
    const candidate = JSON.parse(candidateBytes.toString("utf8"))
    const carrier = JSON.parse(carrierBytes.toString("utf8"))
    const result = consumeV138Plan262103ReviewNoPublish({
      candidate,
      carrier,
      reportBytes,
      authenticateCustody: (validatedCandidate, validatedCarrier, bytes) =>
        authenticateRepositoryReview(
          repoRoot,
          pairCommit,
          validatedCandidate,
          validatedCarrier,
          bytes,
        ),
      deriveFrozenArtifacts: () =>
        deriveFrozenV3Artifacts(repoRoot, pairCommit, candidate),
    })
    writeOutput(`${JSON.stringify(result)}\n`)
    if (result.kind === "integrity_stop") fail(result.reason)
    return
  }
  fail("V138_PLAN_262_103_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  executeV138Plan262103ConsumerCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V138_PLAN_262_103_FAILED"}\n`,
    )
    process.exitCode = 1
  })
}
