import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  sha256V138Secure,
  withV138SecureWorkspaceSession,
  type V138SecureWorkspaceSession,
} from "./lib/v1-38-secure-workspace-path-v3.js"

type Sha = `sha256:${string}`
type Entry = Readonly<{ path: string; sha256: Sha }>
const fail = (code: string): never => {
  throw new TypeError(code)
}
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown =>
    Array.isArray(item)
      ? item.map(normalize)
      : item !== null && typeof item === "object"
        ? Object.fromEntries(
            Object.entries(item as Record<string, unknown>)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, child]) => [key, normalize(child)]),
          )
        : item
  return `${JSON.stringify(normalize(value))}\n`
}
const freeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      freeze(child)
    Object.freeze(value)
  }
  return value
}
const exactKeys = (
  value: unknown,
  expected: readonly string[],
  code: string,
): void => {
  if (
    value === null ||
    typeof value !== "object" ||
    canonical(Object.keys(value as object).sort()) !==
      canonical([...expected].sort())
  )
    fail(code)
}
const json = (session: V138SecureWorkspaceSession, repoPath: string): any =>
  JSON.parse(session.read(repoPath).toString("utf8"))

export const V138_PHASE_262_CORRECTION_V6_PATH =
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v6.json"
const PRIOR: Entry & Readonly<{ root: Sha }> = freeze({
  path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v5.json",
  sha256:
    "sha256:414b830e5dec41693fceb2d4b43c33e7c076065d94fcdd6970fa197d6043fcec",
  root: "sha256:f55a78bed76ca40fbb817fac37c168bf12b684b0772e7dc4876f3f6666ae777a",
})
export const V138_PHASE_262_CORRECTION_V6_TRIGGER = freeze({
  commit: "8a63646d984b5be88245ee45947acfcf22dca254",
  blob: "76705132d67dcf16584f9f8e9e293d9f133cb1cb",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256:
    "sha256:fcbe6806886ae7b2b3454a213dfac0c6beb33afb5f3fcef76005ee672d908762" as Sha,
})
export const V138_PHASE_262_CORRECTION_V6_EVIDENCE = freeze({
  plan89: [
    {
      path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-89-SUMMARY.md",
      sha256:
        "sha256:4fa2ddfa9219654a5d3b163062d06692dcdcf2165c94dd8e99d55bd61013b12e",
    },
    {
      path: ".planning/artifacts/v1.38-plan-262-89-lifecycle-driver-readiness-v2.json",
      sha256:
        "sha256:0862ed0298d84fe73e9eaa76ecd69eb535df3a5d5bc0fce2c29482ef6386e58a",
    },
    {
      path: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json",
      sha256:
        "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6",
    },
    {
      path: "scripts/check-v1-38-plan-262-89-lifecycle-v2.ts",
      sha256:
        "sha256:2d377de7025967188514c022ff3c228ea6362bcdb8383351c6df2f399fcf5214",
    },
    {
      path: "scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts",
      sha256:
        "sha256:7e7bf1807d3ef872099ab8fdcc79997d2e337b2ca006eaacff4d8468669998e1",
    },
  ] as readonly Entry[],
  remediation: [
    {
      path: "scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts",
      sha256:
        "sha256:1c58a620c8d74e1198a358ab25ee539837561fb99bcc2f92d6cddcc06505df71",
    },
    {
      path: "scripts/native/v1-38-successor-transaction-helper-v3.c",
      sha256:
        "sha256:7664fe6f95b984164b60d24b4558107b700cfc348786a6a0d3897eeb3eb5124c",
    },
    {
      path: "scripts/lib/v1-38-secure-workspace-path-v3.ts",
      sha256:
        "sha256:d564f62d46b64479271d4e7675ec505229c4559de420118401b47a43acc618a8",
    },
    {
      path: "scripts/lib/v1-38-secure-workspace-path-v3.test.ts",
      sha256:
        "sha256:547d9310014c7642ea5f92da4f7e0db1a42c0286c0194a2c3dde322a4ac6bf90",
    },
    {
      path: "scripts/native/v1-38-secure-manifest-reader-v3.c",
      sha256:
        "sha256:ffe3cb82853a071b30150ba5d3232183197b334f0016f827fb50b93b93a8452e",
    },
  ] as readonly Entry[],
})
const AUTHORITY_KEYS = freeze([
  "archiveAuthorized",
  "candidateSearchAuthorized",
  "countedPlayAuthorized",
  "formationMaterializationAuthorized",
  "gameplayChangeAuthorized",
  "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized",
  "phase263PlanningAuthorized",
  "productAuthorized",
  "productionAuthorized",
  "publicAuthorized",
  "tagAuthorized",
])

const validateReadiness = (value: any): void => {
  exactKeys(
    value,
    [
      "activationStatus",
      "activePlans",
      "checkerSha256",
      "correctionRoot",
      "correctionStatus",
      "dispositionRoot",
      "lifecycleMutationPerformed",
      "planIdentityRoot",
      "postSummaryDriverInvoked",
      "predecessorSha256",
      "predecessorStatusRoot",
      "preSummarySummaries",
      "readinessRoot",
      "schemaVersion",
      "summaryIdentityRoot",
      "syntheticCorrectionVerified",
      "syntheticMissingActivationVerified",
      "syntheticNonPassVerified",
      "syntheticPassVerified",
      "testSha256",
      "validationSha256",
      "verificationSha256",
      "verificationStatus",
    ],
    "V138_CORRECTION_V6_READINESS_SCHEMA_INVALID",
  )
  const body = JSON.parse(JSON.stringify(value))
  delete body.readinessRoot
  const root = sha256V138Secure(
    `v138-plan26289-lifecycle-driver-readiness-v2\0${canonical(body)}`,
  )
  if (
    value.schemaVersion !== "v1.38-plan-262-89-lifecycle-driver-readiness-v2" ||
    value.readinessRoot !== root ||
    value.checkerSha256 !==
      V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89[3]!.sha256 ||
    value.testSha256 !==
      V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89[4]!.sha256 ||
    value.activePlans !== 70 ||
    value.preSummarySummaries !== 69 ||
    value.verificationStatus !== "gaps_found" ||
    value.postSummaryDriverInvoked !== false ||
    value.lifecycleMutationPerformed !== false ||
    value.correctionStatus !== "absent" ||
    value.correctionRoot !== null ||
    value.activationStatus !== "absent"
  )
    fail("V138_CORRECTION_V6_READINESS_INVALID")
}

const validateLifecycle = (value: any): void => {
  exactKeys(
    value,
    [
      "adjudication",
      "authority",
      "lifecycle",
      "plan89SummarySha256",
      "previousStatusRoot",
      "previousStatusSha256",
      "retryOutcome",
      "schemaVersion",
      "statusRoot",
      "supersedes",
    ],
    "V138_CORRECTION_V6_LIFECYCLE_SCHEMA_INVALID",
  )
  exactKeys(
    value.authority,
    AUTHORITY_KEYS,
    "V138_CORRECTION_V6_LIFECYCLE_AUTHORITY_SCHEMA_INVALID",
  )
  if (AUTHORITY_KEYS.some((key) => value.authority[key] !== false))
    fail("V138_CORRECTION_V6_LIFECYCLE_AUTHORITY_TRUE")
  exactKeys(
    value.lifecycle,
    [
      "activePlans",
      "lifecycleMutationPerformed",
      "phase262Status",
      "plan89VerificationStatus",
      "summaries",
    ],
    "V138_CORRECTION_V6_LIFECYCLE_STATE_SCHEMA_INVALID",
  )
  exactKeys(
    value.retryOutcome,
    [
      "calibrationIdentitiesCharged",
      "freshAccepted",
      "reproductionIdentitiesCharged",
      "reproductionV16Present",
      "requiredAccepted",
      "routeStartsConsumed",
      "terminalDisposition",
    ],
    "V138_CORRECTION_V6_RETRY_SCHEMA_INVALID",
  )
  const body = JSON.parse(JSON.stringify(value))
  delete body.statusRoot
  const statusRoot = sha256V138Secure(
    `v138-phase262-current-lifecycle-status-v2\0${canonical(body)}`,
  )
  if (
    value.schemaVersion !== "v1.38-phase-262-current-lifecycle-status-v2" ||
    value.statusRoot !== statusRoot ||
    value.plan89SummarySha256 !==
      V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89[0]!.sha256 ||
    value.lifecycle.activePlans !== 70 ||
    value.lifecycle.summaries !== 70 ||
    value.lifecycle.phase262Status !== "incomplete" ||
    value.lifecycle.plan89VerificationStatus !== "gaps_found" ||
    value.lifecycle.lifecycleMutationPerformed !== false ||
    value.retryOutcome.terminalDisposition !== "exhausted" ||
    value.retryOutcome.freshAccepted !== 0 ||
    value.retryOutcome.requiredAccepted !== 540 ||
    value.retryOutcome.reproductionV16Present !== false
  )
    fail("V138_CORRECTION_V6_LIFECYCLE_INVALID")
}

type Options = Readonly<{
  triggeringReviewBytes?: Buffer
  historicalGitRoot?: string
}>
const deriveWithSession = (
  session: V138SecureWorkspaceSession,
  rootInput: string,
  options: Options,
): any => {
  session.authenticate([
    PRIOR,
    ...V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89,
    ...V138_PHASE_262_CORRECTION_V6_EVIDENCE.remediation,
  ])
  const prior = freeze(json(session, PRIOR.path))
  if (prior.correctionRoot !== PRIOR.root)
    fail("V138_CORRECTION_V6_PRIOR_ROOT_INVALID")
  const readiness = freeze(
    json(session, V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89[1]!.path),
  )
  validateReadiness(readiness)
  const lifecycle = freeze(
    json(session, V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89[2]!.path),
  )
  validateLifecycle(lifecycle)
  for (const relative of [
    ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json",
    ".planning/artifacts/v1.38-plan-263-activation-v1.json",
  ])
    session.assertAbsent(relative)
  const gitRoot = options.historicalGitRoot ?? rootInput
  const trigger =
    options.triggeringReviewBytes ??
    execFileSync(
      "git",
      [
        "show",
        `${V138_PHASE_262_CORRECTION_V6_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V6_TRIGGER.path}`,
      ],
      { cwd: gitRoot },
    )
  if (sha256V138Secure(trigger) !== V138_PHASE_262_CORRECTION_V6_TRIGGER.sha256)
    fail("V138_CORRECTION_V6_TRIGGER_REVIEW_MISMATCH")
  if (
    options.triggeringReviewBytes === undefined &&
    execFileSync(
      "git",
      [
        "rev-parse",
        `${V138_PHASE_262_CORRECTION_V6_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V6_TRIGGER.path}`,
      ],
      { cwd: gitRoot, encoding: "utf8" },
    ).trim() !== V138_PHASE_262_CORRECTION_V6_TRIGGER.blob
  )
    fail("V138_CORRECTION_V6_TRIGGER_BLOB_MISMATCH")
  const body = freeze({
    schemaVersion: "v1.38-phase-262-review-fix-correction-v6",
    status: "integrity_non_pass",
    supersedesForFutureAuthority: PRIOR.path,
    priorCorrection: PRIOR,
    triggeringReview: {
      ...V138_PHASE_262_CORRECTION_V6_TRIGGER,
      immutableCommitQualifiedBlob: true,
    },
    scopedRootIdentity: {
      deviceAndInodeBoundDuringSession: true,
      hostIdentityPersisted: false,
      readerProtocol: "single-root-descriptor-session-v1",
    },
    reauthenticated: V138_PHASE_262_CORRECTION_V6_EVIDENCE,
    plan89: {
      readinessRoot: readiness.readinessRoot,
      statusRoot: lifecycle.statusRoot,
      phase262Status: "incomplete",
      verificationStatus: "gaps_found",
    },
    empiricalOutcome: {
      terminalDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      reproductionV16Present: false,
      outcomeReinterpreted: false,
    },
    remediation: {
      sourceOnly: true,
      liveAuthority: false,
      independentZeroFindingReviewRequired: true,
      noLiveExecutionPerformed: true,
    },
    forbiddenDestinations: [
      ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json",
      ".planning/artifacts/v1.38-plan-263-activation-v1.json",
    ],
    authority: Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false])),
  })
  return freeze({
    ...body,
    correctionRoot: sha256V138Secure(
      `v138-phase262-review-fix-correction-v6\0${canonical(body)}`,
    ),
  })
}

export const deriveV138Phase262ReviewFixCorrectionV6 = (
  rootInput: string,
  options: Options = {},
): any =>
  withV138SecureWorkspaceSession(rootInput, (session) =>
    deriveWithSession(session, rootInput, options),
  )

export const checkV138Phase262ReviewFixCorrectionV6 = (
  rootInput: string,
  options: Options = {},
): true =>
  withV138SecureWorkspaceSession(rootInput, (session) => {
    const bytes = session
        .read(V138_PHASE_262_CORRECTION_V6_PATH)
        .toString("utf8"),
      candidate = JSON.parse(bytes)
    const expected = deriveWithSession(session, rootInput, options)
    if (
      bytes !== canonical(candidate) ||
      canonical(candidate) !== canonical(expected)
    )
      fail("V138_CORRECTION_V6_MISMATCH")
    return true
  })

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive")
    process.stdout.write(
      canonical(deriveV138Phase262ReviewFixCorrectionV6(process.cwd())),
    )
  else if (process.argv[2] === "--check") {
    checkV138Phase262ReviewFixCorrectionV6(process.cwd())
    process.stdout.write("review_fix_correction_v6_valid=true\n")
  } else fail("V138_CORRECTION_V6_COMMAND_INVALID")
}
