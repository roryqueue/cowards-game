import { Buffer } from "node:buffer"
import { execFile, execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs"
import { arch, cpus, platform, release } from "node:os"
import path from "node:path"
import { setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import {
  V138_BOUNDED_RETRY_IDENTITIES,
  V138_BOUNDED_RETRY_POLICY,
  appendV138RetryJournalRecord,
  checkV138InactiveRetryEnvelope,
  createV138InactiveRetryEnvelope,
  deriveV138RetryState,
  encodeV138RetryCanonicalJson,
  type V138DerivedRetryState,
  type V138InactiveRetryEnvelope,
  type V138RetryCalibrationIdentity,
  type V138RetryJournalEvent,
  type V138RetryJournalRecord,
  type V138RetryReproductionIdentity,
  type V138RetryRouteIdentity,
  type V138RetrySha256,
} from "./lib/v1-38-bounded-retry-envelope.js"
import {
  calibrateV138ParallelMatrix,
  createV138SubprocessShardRunner,
  enumerateV138CurrentMatrix,
  executeV138ParallelMatrix,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  MEMORY_PRESSURE_Q_REQUEST,
  observeDarwinHeadroomOwned,
  type MemoryPressureQCommandResult,
} from "./lib/v1-38-darwin-headroom.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): V138RetrySha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = encodeV138RetryCanonicalJson

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

const PLAN_262_77_PROTECTED_HISTORY = Object.freeze({
  reviewBytes:
    "sha256:76d0c0eef92fca733078d56f786ab2bb2c462ba87c243951793d504078ed54f8" as V138RetrySha256,
  reportBytes:
    "sha256:82de726955d2162dac32b227744efd66f851e7b736f9acaa421d3d514de234b2" as V138RetrySha256,
  summaryBytes:
    "sha256:e84302fa5c820a4c3e904ebb24b8da3dd37211be643920b19b8ca84d537f36a7" as V138RetrySha256,
  reviewRoot:
    "sha256:1d58e184fd6283e3d62c7de0c4dc51cad4f8e5447bb70b2fa48d13588aade8f3" as V138RetrySha256,
  finding: "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED" as const,
})

export const V138_BOUNDED_RETRY_PATHS = Object.freeze({
  sourceSummary: `${PHASE_DIR}/262-82-SUMMARY.md`,
  sourceController: "scripts/run-v1-38-bounded-retry-envelope.ts",
  sourceModel: "scripts/lib/v1-38-bounded-retry-envelope.ts",
  sourceTests: "scripts/run-v1-38-bounded-retry-envelope.test.ts",
  sourceReview:
    ".planning/artifacts/v1.38-plan-262-83-bounded-retry-source-rereview-v1.json",
  sourceReviewReport: `${PHASE_DIR}/262-83-REVIEW.md`,
  protectedSourceReview:
    ".planning/artifacts/v1.38-plan-262-77-bounded-retry-source-review-v1.json",
  protectedSourceReviewReport: `${PHASE_DIR}/262-77-REVIEW.md`,
  protectedSourceReviewSummary: `${PHASE_DIR}/262-77-SUMMARY.md`,
  seal: ".planning/artifacts/v1.38-successor-source-seal-v11.json",
  envelope: ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
  localSeal:
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  historyBinder:
    ".planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v1",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v15.json",
})

export const V138_BOUNDED_RETRY_PRODUCTION_MODES = Object.freeze([
  "--derive-seal-envelope-no-publish",
  "--publish-sealed-inactive-envelope",
  "--check-sealed-inactive-envelope",
  "--run-bounded-live-envelope",
] as const)

const HISTORICAL_IDENTITIES = Object.freeze([
  ...Array.from({ length: 5 }, (_, ordinal) => `route:v${ordinal + 3}`),
  ...Array.from({ length: 5 }, (_, ordinal) => `preflight:v${ordinal + 5}:0`),
  ...Array.from({ length: 5 }, (_, version) =>
    Array.from(
      { length: 8 },
      (_, ordinal) => `calibration:v${version + 5}:${ordinal}`,
    ),
  ).flat(),
  "route:v8:pre_start_obstruction",
])

type PreflightResult =
  | Readonly<{
      available: true
      effectiveAvailableBasisPoints: number
    }>
  | Readonly<{ available: false }>

export interface V138BoundedRetryControllerEffects {
  readonly monotonicMilliseconds: () => number
  readonly waitUntil: (targetMilliseconds: number) => Promise<void>
  readonly observePreflight: () => Promise<PreflightResult>
  readonly runCalibration: (
    input: Readonly<{
      routeIdentity: V138RetryRouteIdentity
      identities: readonly V138RetryCalibrationIdentity[]
    }>,
  ) => Promise<
    Readonly<{
      status: "admitted" | "system_failure"
      completeCleanup: boolean
      supervisionRoot?: V138RetrySha256
    }>
  >
  readonly runReproduction: (
    input: Readonly<{
      routeIdentity: V138RetryRouteIdentity
      identities: readonly V138RetryReproductionIdentity[]
    }>,
  ) => Promise<
    Readonly<{
      status: "passed_exact" | "system_failure"
      acceptedCells: number
      completeCleanup: boolean
      reproductionRoot?: V138RetrySha256
      artifact?: unknown
    }>
  >
  readonly appendDurableRecord: (record: V138RetryJournalRecord) => void
}

export interface V138BoundedRetryControllerResult {
  readonly records: readonly V138RetryJournalRecord[]
  readonly state: Readonly<V138DerivedRetryState>
  readonly reproductionArtifact?: unknown
}

const recordFor = <K extends V138RetryJournalEvent["kind"]>(
  records: readonly V138RetryJournalRecord[],
  kind: K,
) =>
  records.filter(
    (record): record is Extract<V138RetryJournalRecord, { kind: K }> =>
      record.kind === kind,
  )

const waitTarget = (records: readonly V138RetryJournalRecord[]): number => {
  const observations = recordFor(records, "observe_preflight")
  const lastRefusal = observations
    .filter(
      ({ effectiveAvailableBasisPoints }) =>
        effectiveAvailableBasisPoints < 2_500,
    )
    .at(-1)
  const calibrationFailure = recordFor(records, "finish_calibration")
    .filter(
      ({ status, completeCleanup }) =>
        status === "system_failure" && completeCleanup,
    )
    .at(-1)
  return Math.max(
    lastRefusal === undefined
      ? 0
      : lastRefusal.atMilliseconds +
          V138_BOUNDED_RETRY_POLICY.refusalSpacingMilliseconds,
    calibrationFailure === undefined
      ? 0
      : calibrationFailure.atMilliseconds +
          V138_BOUNDED_RETRY_POLICY.calibrationFailureBackoffMilliseconds,
  )
}

export const runV138BoundedRetryController = async (
  input: Readonly<{
    envelope: unknown
    owner: string
    records: readonly V138RetryJournalRecord[]
    effects: V138BoundedRetryControllerEffects
  }>,
): Promise<Readonly<V138BoundedRetryControllerResult>> => {
  const envelope = checkV138InactiveRetryEnvelope(input.envelope)
  let records = [...input.records] as readonly V138RetryJournalRecord[]
  let reproductionArtifact: unknown
  const append = (event: V138RetryJournalEvent): void => {
    const next = appendV138RetryJournalRecord(
      records,
      event,
      input.effects.monotonicMilliseconds(),
      envelope.envelopeRoot,
    )
    const record = next.at(-1)!
    input.effects.appendDurableRecord(record)
    records = next
  }
  const finish = (): Readonly<V138BoundedRetryControllerResult> =>
    Object.freeze({
      records: Object.freeze([...records]),
      state: deriveV138RetryState(envelope, records),
      ...(reproductionArtifact === undefined ? {} : { reproductionArtifact }),
    })
  const deadlineGuard = (): boolean => {
    const state = deriveV138RetryState(envelope, records)
    if (state.disposition !== "active") return true
    if (state.firstObservationMilliseconds === null) return false
    const now = input.effects.monotonicMilliseconds()
    if (
      now <
      state.firstObservationMilliseconds +
        V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
    ) {
      return false
    }
    append({
      kind: "time_window_expired",
      owner: input.owner,
      reason: "time_window_expired",
    })
    return true
  }

  if (deadlineGuard()) return finish()

  // A prior invocation may have died only after its durable reservation.
  // Reconciliation charges the work and fails closed; it never relaunches the
  // same identity or asserts cleanup that the journal cannot prove.
  const pendingReproduction = recordFor(records, "reserve_reproduction").find(
    ({ routeIdentity }) =>
      !recordFor(records, "finish_reproduction").some(
        (terminal) => terminal.routeIdentity === routeIdentity,
      ),
  )
  if (pendingReproduction !== undefined) {
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_reproduction",
      routeIdentity: pendingReproduction.routeIdentity,
      owner: pendingReproduction.owner,
      status: "system_failure",
      acceptedCells: 0,
      completeCleanup: false,
    })
  } else {
    const pendingCalibration = recordFor(records, "reserve_calibration").find(
      ({ routeIdentity }) =>
        !recordFor(records, "finish_calibration").some(
          (terminal) => terminal.routeIdentity === routeIdentity,
        ),
    )
    if (pendingCalibration !== undefined) {
      if (deadlineGuard()) return finish()
      append({
        kind: "finish_calibration",
        routeIdentity: pendingCalibration.routeIdentity,
        owner: pendingCalibration.owner,
        status: "system_failure",
        completeCleanup: false,
      })
    } else {
      const pendingRoute = recordFor(records, "reserve_route").find(
        ({ identity }) =>
          !recordFor(records, "reserve_calibration").some(
            (reservation) => reservation.routeIdentity === identity,
          ),
      )
      if (pendingRoute !== undefined) {
        const routeOrdinal = V138_BOUNDED_RETRY_IDENTITIES.routes.indexOf(
          pendingRoute.identity,
        )
        const identities = V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(
          routeOrdinal * 8,
          routeOrdinal * 8 + 8,
        )
        if (deadlineGuard()) return finish()
        append({
          kind: "reserve_calibration",
          routeIdentity: pendingRoute.identity,
          owner: pendingRoute.owner,
          identities,
        })
        if (deadlineGuard()) return finish()
        append({
          kind: "finish_calibration",
          routeIdentity: pendingRoute.identity,
          owner: pendingRoute.owner,
          status: "system_failure",
          completeCleanup: false,
        })
      }
      const pendingPreflight =
        pendingRoute === undefined
          ? recordFor(records, "reserve_preflight").find(
              ({ identity }) =>
                !recordFor(records, "observe_preflight").some(
                  (observation) => observation.identity === identity,
                ),
            )
          : undefined
      if (pendingPreflight !== undefined) {
        if (deadlineGuard()) return finish()
        append({
          kind: "observe_preflight",
          identity: pendingPreflight.identity,
          owner: pendingPreflight.owner,
          effectiveAvailableBasisPoints: 0,
        })
      }
    }
  }

  if (deadlineGuard()) return finish()

  const admittedAwaitingReproduction = recordFor(
    records,
    "finish_calibration",
  ).find(
    ({ routeIdentity, status, completeCleanup }) =>
      status === "admitted" &&
      completeCleanup &&
      !recordFor(records, "reserve_reproduction").some(
        (reservation) => reservation.routeIdentity === routeIdentity,
      ),
  )
  if (
    deriveV138RetryState(envelope, records).disposition === "active" &&
    admittedAwaitingReproduction !== undefined
  ) {
    const routeIdentity = admittedAwaitingReproduction.routeIdentity
    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_reproduction",
      routeIdentity,
      owner: admittedAwaitingReproduction.owner,
      identities: V138_BOUNDED_RETRY_IDENTITIES.reproduction,
    })
    if (deadlineGuard()) return finish()
    let reproduction: Awaited<
      ReturnType<V138BoundedRetryControllerEffects["runReproduction"]>
    >
    try {
      reproduction = await input.effects.runReproduction({
        routeIdentity,
        identities: V138_BOUNDED_RETRY_IDENTITIES.reproduction,
      })
    } catch {
      reproduction = {
        status: "system_failure",
        acceptedCells: 0,
        completeCleanup: false,
      }
    }
    reproductionArtifact = reproduction.artifact
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_reproduction",
      routeIdentity,
      owner: admittedAwaitingReproduction.owner,
      status: reproduction.status,
      acceptedCells: reproduction.acceptedCells,
      completeCleanup: reproduction.completeCleanup,
      ...(reproduction.reproductionRoot === undefined
        ? {}
        : { reproductionRoot: reproduction.reproductionRoot }),
    })
  }

  while (deriveV138RetryState(envelope, records).disposition === "active") {
    if (deadlineGuard()) return finish()
    const state = deriveV138RetryState(envelope, records)
    if (state.nextPreflightIdentity === null) break
    const target = waitTarget(records)
    if (input.effects.monotonicMilliseconds() < target) {
      await input.effects.waitUntil(target)
    }
    if (deadlineGuard()) return finish()
    const preflightIdentity = state.nextPreflightIdentity
    append({
      kind: "reserve_preflight",
      identity: preflightIdentity,
      owner: input.owner,
    })
    if (deadlineGuard()) return finish()
    let observation: PreflightResult
    try {
      observation = await input.effects.observePreflight()
    } catch {
      observation = { available: false }
    }
    if (deadlineGuard()) return finish()
    const basisPoints = observation.available
      ? observation.effectiveAvailableBasisPoints
      : 0
    append({
      kind: "observe_preflight",
      identity: preflightIdentity,
      owner: input.owner,
      effectiveAvailableBasisPoints: basisPoints,
    })
    if (basisPoints < 2_500) continue

    const admittedState = deriveV138RetryState(envelope, records)
    const routeIdentity = admittedState.nextRouteIdentity
    if (routeIdentity === null) break
    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_route",
      identity: routeIdentity,
      owner: input.owner,
      preflightIdentity,
    })
    const routeOrdinal =
      V138_BOUNDED_RETRY_IDENTITIES.routes.indexOf(routeIdentity)
    const calibrationIdentities =
      V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(
        routeOrdinal * 8,
        routeOrdinal * 8 + 8,
      )
    append({
      kind: "reserve_calibration",
      routeIdentity,
      owner: input.owner,
      identities: calibrationIdentities,
    })
    if (deadlineGuard()) return finish()
    let calibration: Awaited<
      ReturnType<V138BoundedRetryControllerEffects["runCalibration"]>
    >
    try {
      calibration = await input.effects.runCalibration({
        routeIdentity,
        identities: calibrationIdentities,
      })
    } catch {
      calibration = { status: "system_failure", completeCleanup: false }
    }
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_calibration",
      routeIdentity,
      owner: input.owner,
      status: calibration.status,
      completeCleanup: calibration.completeCleanup,
      ...(calibration.supervisionRoot === undefined
        ? {}
        : { supervisionRoot: calibration.supervisionRoot }),
    })
    if (calibration.status !== "admitted" || !calibration.completeCleanup) {
      continue
    }

    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_reproduction",
      routeIdentity,
      owner: input.owner,
      identities: V138_BOUNDED_RETRY_IDENTITIES.reproduction,
    })
    if (deadlineGuard()) return finish()
    let reproduction: Awaited<
      ReturnType<V138BoundedRetryControllerEffects["runReproduction"]>
    >
    try {
      reproduction = await input.effects.runReproduction({
        routeIdentity,
        identities: V138_BOUNDED_RETRY_IDENTITIES.reproduction,
      })
    } catch {
      reproduction = {
        status: "system_failure",
        acceptedCells: 0,
        completeCleanup: false,
      }
    }
    reproductionArtifact = reproduction.artifact
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_reproduction",
      routeIdentity,
      owner: input.owner,
      status: reproduction.status,
      acceptedCells: reproduction.acceptedCells,
      completeCleanup: reproduction.completeCleanup,
      ...(reproduction.reproductionRoot === undefined
        ? {}
        : { reproductionRoot: reproduction.reproductionRoot }),
    })
  }
  return finish()
}

const safeStatus = (
  target: string,
): "missing" | "regular" | "directory" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "missing"
    throw error
  }
}

const readNoFollow = (repoRoot: string, repoPath: string): Buffer => {
  const target = path.resolve(repoRoot, repoPath)
  if (safeStatus(target) !== "regular") fail("V138_RETRY_INPUT_UNSAFE")
  const before = lstatSync(target)
  const descriptor = openSync(
    target,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    const opened = fstatSync(descriptor)
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino
    )
      fail("V138_RETRY_INPUT_UNSAFE")
    return readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

const readJsonNoFollow = (repoRoot: string, repoPath: string): unknown => {
  try {
    return JSON.parse(readNoFollow(repoRoot, repoPath).toString("utf8"))
  } catch (error) {
    if (error instanceof Error && error.message === "V138_RETRY_INPUT_UNSAFE")
      throw error
    return fail("V138_RETRY_INPUT_INVALID")
  }
}

const exclusiveWrite = (target: string, bytes: string, mode = 0o600): void => {
  if (safeStatus(target) === "unsafe") fail("V138_RETRY_DESTINATION_UNSAFE")
  if (safeStatus(target) !== "missing") fail("V138_RETRY_DESTINATION_PRESENT")
  const descriptor = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    mode,
  )
  try {
    fchmodSync(descriptor, mode)
    const buffer = Buffer.from(bytes, "utf8")
    let offset = 0
    while (offset < buffer.length)
      offset += writeSync(descriptor, buffer, offset, buffer.length - offset)
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

const v138RetryTerminalResult = (
  result: Readonly<V138BoundedRetryControllerResult>,
) => {
  if (result.state.disposition === "active") {
    fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  }
  return Object.freeze({
    schemaVersion: "v1.38-current-matrix-retry-terminal-v1" as const,
    terminalReason: result.state.terminalReason,
    journalRoot: result.state.journalRoot,
    stateRoot: result.state.stateRoot,
    disposition: result.state.disposition,
    counters: Object.freeze({
      preflightObservationsConsumed: result.state.preflightObservationsConsumed,
      routeStartsConsumed: result.state.routeStartsConsumed,
      calibrationIdentitiesCharged: result.state.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged: result.state.reproductionIdentitiesCharged,
      acceptedCells: result.state.acceptedCells,
    }),
    freshAccepted: result.state.acceptedCells,
    completeCleanup: true as const,
    downstreamAuthority: "denied" as const,
    productionAuthorized: false as const,
  })
}

export const publishV138RetryTerminalResult = (
  target: string,
  result: Readonly<V138BoundedRetryControllerResult>,
): void => {
  exclusiveWrite(target, canonical(v138RetryTerminalResult(result)))
  fsyncParent(target)
}

const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY)
  try {
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

export interface V138SuccessorSourceSealV11 {
  readonly schemaVersion: "v1.38-successor-source-seal-v11"
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

export interface V138DerivedSealEnvelope {
  readonly seal: Readonly<V138SuccessorSourceSealV11>
  readonly envelope: Readonly<V138InactiveRetryEnvelope>
}

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }).trim()

export const deriveV138SealedInactiveEnvelope = (
  repoRoot: string,
  directParentCommit = git(repoRoot, ["rev-parse", "HEAD"]),
): Readonly<V138DerivedSealEnvelope> => {
  const sourcePaths = [
    V138_BOUNDED_RETRY_PATHS.sourceSummary,
    V138_BOUNDED_RETRY_PATHS.sourceController,
    V138_BOUNDED_RETRY_PATHS.sourceModel,
    V138_BOUNDED_RETRY_PATHS.sourceTests,
  ]
  const custodyPaths = [
    ...sourcePaths,
    V138_BOUNDED_RETRY_PATHS.sourceReview,
    V138_BOUNDED_RETRY_PATHS.sourceReviewReport,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReview,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReviewReport,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReviewSummary,
    V138_BOUNDED_RETRY_PATHS.localSeal,
    V138_BOUNDED_RETRY_PATHS.historyBinder,
  ]
  if (git(repoRoot, ["status", "--porcelain", "--", ...custodyPaths]) !== "") {
    fail("V138_RETRY_SOURCE_DIRTY")
  }
  for (const repoPath of custodyPaths) {
    const working = readNoFollow(repoRoot, repoPath)
    let committed: Buffer
    try {
      committed = execFileSync(
        "git",
        ["show", `${directParentCommit}:${repoPath}`],
        { cwd: repoRoot, maxBuffer: 8 * 1024 * 1024 },
      )
    } catch {
      return fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
    }
    if (!working.equals(committed)) fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  }
  const sourceBytes = sourcePaths.map((repoPath) => ({
    repoPath,
    sha256: sha256(readNoFollow(repoRoot, repoPath)),
  }))
  const protectedReviewBytes = readNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReview,
  )
  const protectedReview = JSON.parse(
    protectedReviewBytes.toString("utf8"),
  ) as Record<string, unknown>
  const protectedFindings = protectedReview.findings as
    | readonly Record<string, unknown>[]
    | undefined
  if (
    sha256(protectedReviewBytes) !==
      PLAN_262_77_PROTECTED_HISTORY.reviewBytes ||
    sha256(
      readNoFollow(
        repoRoot,
        V138_BOUNDED_RETRY_PATHS.protectedSourceReviewReport,
      ),
    ) !== PLAN_262_77_PROTECTED_HISTORY.reportBytes ||
    sha256(
      readNoFollow(
        repoRoot,
        V138_BOUNDED_RETRY_PATHS.protectedSourceReviewSummary,
      ),
    ) !== PLAN_262_77_PROTECTED_HISTORY.summaryBytes ||
    protectedReview.reviewRoot !== PLAN_262_77_PROTECTED_HISTORY.reviewRoot ||
    protectedReview.status !== "blocked" ||
    protectedReview.sourceReviewPassed !== false ||
    protectedReview.findingCount !== 1 ||
    protectedFindings?.length !== 1 ||
    protectedFindings[0]?.code !== PLAN_262_77_PROTECTED_HISTORY.finding
  ) {
    fail("V138_RETRY_PROTECTED_PLAN_77_HISTORY_INVALID")
  }
  const reviewBytes = readNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.sourceReview,
  )
  const review = JSON.parse(reviewBytes.toString("utf8")) as Record<
    string,
    unknown
  >
  if (
    review.findingCount !== 0 ||
    !["passed", "passed_exact", "zero_findings"].includes(
      String(review.status),
    ) ||
    review.productionAuthorized === true
  ) {
    fail("V138_RETRY_REVIEW_INVALID")
  }
  readNoFollow(repoRoot, V138_BOUNDED_RETRY_PATHS.sourceReviewReport)
  const localSeal = readJsonNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.localSeal,
  ) as Record<string, unknown>
  if (
    localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true ||
    localSeal.independentCustodyClaimed !== false ||
    typeof localSeal.verificationRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(localSeal.verificationRoot)
  ) {
    fail("V138_RETRY_LOCAL_SEAL_INVALID")
  }
  const historyBytes = readNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.historyBinder,
  )
  const history = JSON.parse(historyBytes.toString("utf8")) as Record<
    string,
    unknown
  >
  if (
    history.schemaVersion !== "v1.38-plan-262-74-post-validation-binder-v1" ||
    history.admit03 !== "blocked" ||
    history.freshCharged !== 0 ||
    history.freshAccepted !== 0 ||
    history.downstreamAuthorityDenied !== true ||
    typeof history.binderRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(history.binderRoot)
  ) {
    fail("V138_RETRY_HISTORY_INVALID")
  }
  const reviewRoot =
    typeof review.reviewRoot === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(review.reviewRoot)
      ? (review.reviewRoot as V138RetrySha256)
      : sha256(reviewBytes)
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v11" as const,
    sourceCommit: directParentCommit,
    sourceTree: git(repoRoot, ["rev-parse", `${directParentCommit}^{tree}`]),
    directParentCommit,
    sourceRoot: sha256(canonical(sourceBytes)),
    reviewRoot,
    reviewCommit: git(repoRoot, [
      "rev-list",
      "-1",
      directParentCommit,
      "--",
      V138_BOUNDED_RETRY_PATHS.sourceReview,
      V138_BOUNDED_RETRY_PATHS.sourceReviewReport,
    ]),
    localSealVerificationRoot: localSeal.verificationRoot as V138RetrySha256,
    protectedHistoryRoot: history.binderRoot as V138RetrySha256,
    directChild: true as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const seal = Object.freeze({
    ...body,
    sealRoot: sha256(`v138-successor-source-seal-v11\0${canonical(body)}`),
  })
  return Object.freeze({
    seal,
    envelope: createV138InactiveRetryEnvelope({
      sourceRoot: seal.sourceRoot,
      reviewRoot: seal.reviewRoot,
      sealRoot: seal.sealRoot,
      protectedHistoryRoot: seal.protectedHistoryRoot,
      protectedHistoricalIdentities: HISTORICAL_IDENTITIES,
    }),
  })
}

const publishPair = (
  repoRoot: string,
  artifacts: V138DerivedSealEnvelope,
): void => {
  const seal = path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.seal)
  const envelope = path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.envelope)
  for (const target of [seal, envelope]) {
    const status = safeStatus(target)
    if (status === "unsafe") fail("V138_RETRY_DESTINATION_UNSAFE")
    if (status !== "missing") fail("V138_RETRY_DESTINATION_PRESENT")
  }
  exclusiveWrite(seal, canonical(artifacts.seal))
  try {
    exclusiveWrite(envelope, canonical(artifacts.envelope))
  } catch (error) {
    fail(
      `V138_RETRY_PARTIAL_PUBLICATION:${
        error instanceof Error ? error.message : "unknown"
      }`,
    )
  }
  fsyncParent(envelope)
}

const checkPublishedPair = (
  repoRoot: string,
  injectedDerivation?: () => Readonly<V138DerivedSealEnvelope>,
): Readonly<V138DerivedSealEnvelope> => {
  const sealValue = readJsonNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.seal,
  ) as V138SuccessorSourceSealV11
  const envelopeValue = checkV138InactiveRetryEnvelope(
    readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_PATHS.envelope),
  )
  let expected: Readonly<V138DerivedSealEnvelope>
  if (injectedDerivation !== undefined) {
    expected = injectedDerivation()
  } else {
    if (!/^[0-9a-f]{40}$/u.test(String(sealValue.directParentCommit))) {
      fail("V138_RETRY_SEALED_ENVELOPE_INVALID")
    }
    expected = deriveV138SealedInactiveEnvelope(
      repoRoot,
      sealValue.directParentCommit,
    )
    const sealCommit = git(repoRoot, [
      "rev-list",
      "-1",
      "HEAD",
      "--",
      V138_BOUNDED_RETRY_PATHS.seal,
    ])
    if (
      git(repoRoot, [
        "status",
        "--porcelain",
        "--",
        V138_BOUNDED_RETRY_PATHS.seal,
        V138_BOUNDED_RETRY_PATHS.envelope,
      ]) !== ""
    )
      fail("V138_RETRY_SEALED_ENVELOPE_DIRTY")
    const sealParent = git(repoRoot, [
      "show",
      "-s",
      "--format=%P",
      sealCommit,
    ]).split(" ")[0]
    if (
      sealParent !== sealValue.directParentCommit ||
      git(repoRoot, ["merge-base", "--is-ancestor", sealCommit, "HEAD"]) !== ""
    ) {
      fail("V138_RETRY_SEAL_DIRECT_CHILD_INVALID")
    }
  }
  if (
    canonical(sealValue) !== canonical(expected.seal) ||
    canonical(envelopeValue) !== canonical(expected.envelope)
  ) {
    fail("V138_RETRY_SEALED_ENVELOPE_INVALID")
  }
  return Object.freeze({ seal: sealValue, envelope: envelopeValue })
}

const exactArgs = (
  argv: readonly string[],
  expected: Readonly<Record<string, string>>,
): true => {
  if (argv.length !== Object.keys(expected).length * 2) {
    fail("V138_RETRY_ARGUMENTS_INVALID")
  }
  const seen = new Set<string>()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (
      key === undefined ||
      value === undefined ||
      seen.has(key) ||
      expected[key] !== value
    )
      fail("V138_RETRY_ARGUMENTS_INVALID")
    seen.add(key)
  }
  if (seen.size !== Object.keys(expected).length) {
    fail("V138_RETRY_ARGUMENTS_INVALID")
  }
  return true
}

const LIVE_FLAGS = Object.freeze({
  "--source-summary": V138_BOUNDED_RETRY_PATHS.sourceSummary,
  "--source-controller": V138_BOUNDED_RETRY_PATHS.sourceController,
  "--source-model": V138_BOUNDED_RETRY_PATHS.sourceModel,
  "--source-tests": V138_BOUNDED_RETRY_PATHS.sourceTests,
  "--source-review": V138_BOUNDED_RETRY_PATHS.sourceReview,
  "--source-review-report": V138_BOUNDED_RETRY_PATHS.sourceReviewReport,
  "--seal": V138_BOUNDED_RETRY_PATHS.seal,
  "--envelope": V138_BOUNDED_RETRY_PATHS.envelope,
  "--local-seal": V138_BOUNDED_RETRY_PATHS.localSeal,
  "--history-binder": V138_BOUNDED_RETRY_PATHS.historyBinder,
  "--journal": V138_BOUNDED_RETRY_PATHS.journal,
  "--terminal": V138_BOUNDED_RETRY_PATHS.terminal,
  "--private-dir": V138_BOUNDED_RETRY_PATHS.privateDir,
  "--reproduction": V138_BOUNDED_RETRY_PATHS.reproduction,
})
export const V138_BOUNDED_RETRY_LIVE_FLAGS = LIVE_FLAGS

const PAIR_FLAGS = Object.freeze({
  "--seal": V138_BOUNDED_RETRY_PATHS.seal,
  "--envelope": V138_BOUNDED_RETRY_PATHS.envelope,
})

const executeMemoryPressure = (): Promise<MemoryPressureQCommandResult> =>
  new Promise((resolve) => {
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    let timedOut = false
    const child = execFile(
      MEMORY_PRESSURE_Q_REQUEST.executable,
      [...MEMORY_PRESSURE_Q_REQUEST.args],
      {
        env: MEMORY_PRESSURE_Q_REQUEST.env,
        timeout: MEMORY_PRESSURE_Q_REQUEST.timeoutMilliseconds,
        maxBuffer: MEMORY_PRESSURE_Q_REQUEST.maximumOutputBytes,
        encoding: "buffer",
      },
      (error, out, err) => {
        stdout = Buffer.from(out ?? [])
        stderr = Buffer.from(err ?? [])
        const details = error as {
          killed?: boolean
          signal?: MemoryPressureQCommandResult["signal"]
          code?: string | number
        }
        timedOut = details?.killed === true
        resolve({
          stdout,
          stderr,
          exitCode:
            typeof details?.code === "number"
              ? details.code
              : error === null
                ? 0
                : null,
          signal: details?.signal ?? null,
          timedOut,
        })
      },
    )
    child.stdin?.end()
  })

const buildV138ReproductionV15 = (
  input: Readonly<{
    execution: Awaited<ReturnType<typeof executeV138ParallelMatrix>>
    admittedCalibrationRoot: V138RetrySha256
  }>,
): Readonly<Record<string, unknown>> => {
  const completeCleanup = input.execution.terminals.every(
    ({ cleanup }) =>
      cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
  )
  const passed =
    input.execution.status === "complete_pending_publication" &&
    input.execution.accounting.terminalAttemptCount === 540 &&
    input.execution.accounting.failedAttemptCount === 0 &&
    input.execution.accounting.cancelledAttemptCount === 0 &&
    input.execution.accounting.unlaunchedAttemptCount === 0 &&
    completeCleanup
  const body = {
    schemaVersion: "v1.38-current-matrix-reproduction-v15" as const,
    status: passed
      ? ("passed_exact" as const)
      : ("stopped_process_failure" as const),
    admittedCalibrationRoot: input.admittedCalibrationRoot,
    chargedAttemptCount: 540 as const,
    acceptedCellCount: passed ? (540 as const) : (0 as const),
    completeCleanup,
    executionRoot: sha256(canonical(input.execution)),
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    samplingMilliseconds: 200 as const,
    partialAcceptedEvidenceReusable: false as const,
    privacyProjection: Object.freeze({
      strategySourceIncluded: false as const,
      strategyMemoryIncluded: false as const,
      soldierMemoryIncluded: false as const,
      objectivePayloadIncluded: false as const,
      rawDiagnosticsIncluded: false as const,
    }),
    phase263PlanningAuthorized: false as const,
    candidateSearchAuthorized: false as const,
    formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const,
    productAuthorized: false as const,
    productionAuthorized: false as const,
  }
  return Object.freeze({
    ...body,
    receiptRoot: sha256(
      `v138-current-matrix-reproduction-v15\0${canonical(body)}`,
    ),
  })
}

export const createV138ProductionControllerEffects = (
  repoRoot: string,
  appendDurableRecord: (record: V138RetryJournalRecord) => void,
): V138BoundedRetryControllerEffects => {
  let admittedCalibrationRoot: V138RetrySha256 | undefined
  return {
    monotonicMilliseconds: () => Number(process.hrtime.bigint() / 1_000_000n),
    waitUntil: async (target) => {
      const remaining = Math.max(
        0,
        target - Number(process.hrtime.bigint() / 1_000_000n),
      )
      await new Promise<void>((resolve) => setTimeout(resolve, remaining))
    },
    observePreflight: async () => {
      const result = await observeDarwinHeadroomOwned(executeMemoryPressure)
      return result.ok
        ? {
            available: true as const,
            effectiveAvailableBasisPoints:
              result.observation.observedBasisPoints,
          }
        : { available: false as const }
    },
    runCalibration: async () => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const receipt = await calibrateV138ParallelMatrix({
        inventory,
        runner: createV138SubprocessShardRunner(repoRoot, {
          useLegacyHostMemory: false,
        }),
        hardwareIdentity: {
          operatingSystem: `${platform()} ${release()}`,
          architecture: arch(),
          nodeVersion: process.version,
          cpuIdentity: cpus()[0]?.model ?? "unavailable",
        },
        sharedHeadroomObserver: () =>
          observeDarwinHeadroomOwned(executeMemoryPressure),
        repoRoot,
      })
      admittedCalibrationRoot =
        receipt.status === "admitted" ? receipt.calibrationRoot : undefined
      return {
        status:
          receipt.status === "admitted"
            ? ("admitted" as const)
            : ("system_failure" as const),
        completeCleanup: receipt.terminals.every(
          ({ cleanup }) =>
            cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
        ),
        supervisionRoot: receipt.calibrationRoot,
      }
    },
    runReproduction: async () => {
      if (admittedCalibrationRoot === undefined) {
        fail("V138_RETRY_ADMITTED_CALIBRATION_REQUIRED")
      }
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const result = await executeV138ParallelMatrix({
        inventory,
        admittedCalibrationRoot,
        runner: createV138SubprocessShardRunner(repoRoot, {
          useLegacyHostMemory: false,
        }),
        sharedHeadroomObserver: () =>
          observeDarwinHeadroomOwned(executeMemoryPressure),
        repoRoot,
      })
      const artifact = buildV138ReproductionV15({
        execution: result,
        admittedCalibrationRoot,
      })
      const passed = artifact.status === "passed_exact"
      return {
        status: passed
          ? ("passed_exact" as const)
          : ("system_failure" as const),
        acceptedCells: passed ? 540 : 0,
        completeCleanup: result.terminals.every(
          ({ cleanup }) =>
            cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
        ),
        reproductionRoot: artifact.receiptRoot as V138RetrySha256,
        artifact,
      }
    },
    appendDurableRecord,
  }
}

const readJournal = (repoRoot: string): readonly V138RetryJournalRecord[] => {
  const target = path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.journal)
  if (safeStatus(target) === "missing") return []
  const text = readNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.journal,
  ).toString("utf8")
  if (text.length === 0 || !text.endsWith("\n")) {
    fail("V138_RETRY_JOURNAL_INVALID")
  }
  try {
    return text
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line))
  } catch {
    return fail("V138_RETRY_JOURNAL_INVALID")
  }
}

const journalAppender = (
  repoRoot: string,
): ((record: V138RetryJournalRecord) => void) => {
  const target = path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.journal)
  if (safeStatus(target) === "missing") {
    exclusiveWrite(target, "")
    fsyncParent(target)
  }
  if (safeStatus(target) !== "regular") fail("V138_RETRY_JOURNAL_UNSAFE")
  return (record) => {
    const descriptor = openSync(
      target,
      constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
    )
    try {
      const bytes = Buffer.from(canonical(record))
      let offset = 0
      while (offset < bytes.length)
        offset += writeSync(descriptor, bytes, offset, bytes.length - offset)
      fsyncSync(descriptor)
    } finally {
      closeSync(descriptor)
    }
  }
}

const runProductionLive = async (repoRoot: string): Promise<void> => {
  const { envelope } = checkPublishedPair(repoRoot)
  for (const repoPath of [
    V138_BOUNDED_RETRY_PATHS.sourceSummary,
    V138_BOUNDED_RETRY_PATHS.sourceController,
    V138_BOUNDED_RETRY_PATHS.sourceModel,
    V138_BOUNDED_RETRY_PATHS.sourceTests,
    V138_BOUNDED_RETRY_PATHS.sourceReview,
    V138_BOUNDED_RETRY_PATHS.sourceReviewReport,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReview,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReviewReport,
    V138_BOUNDED_RETRY_PATHS.protectedSourceReviewSummary,
    V138_BOUNDED_RETRY_PATHS.seal,
    V138_BOUNDED_RETRY_PATHS.envelope,
    V138_BOUNDED_RETRY_PATHS.localSeal,
    V138_BOUNDED_RETRY_PATHS.historyBinder,
  ])
    readNoFollow(repoRoot, repoPath)
  const terminalTarget = path.resolve(
    repoRoot,
    V138_BOUNDED_RETRY_PATHS.terminal,
  )
  const terminalStatus = safeStatus(terminalTarget)
  if (terminalStatus === "unsafe" || terminalStatus === "directory") {
    fail("V138_RETRY_DESTINATION_UNSAFE")
  }
  if (terminalStatus === "regular") {
    const terminal = readJsonNoFollow(
      repoRoot,
      V138_BOUNDED_RETRY_PATHS.terminal,
    ) as Record<string, unknown>
    const records = readJournal(repoRoot)
    const state = deriveV138RetryState(envelope, records)
    const expectedTerminal = v138RetryTerminalResult({ records, state })
    const reproductionStatus = safeStatus(
      path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.reproduction),
    )
    if (
      canonical(terminal) !== canonical(expectedTerminal) ||
      state.disposition === "active" ||
      (state.disposition === "succeeded") !==
        (reproductionStatus === "regular") ||
      reproductionStatus === "unsafe" ||
      reproductionStatus === "directory"
    ) {
      fail("V138_RETRY_DUPLICATE_INVOCATION_INVALID")
    }
    return
  }
  const lock = path.resolve(
    repoRoot,
    `${V138_BOUNDED_RETRY_PATHS.journal}.lock`,
  )
  exclusiveWrite(
    lock,
    canonical({
      schemaVersion: "v1.38-bounded-retry-owner-lock-v1",
      owner: "repository_operator",
    }),
  )
  try {
    const privateTarget = path.resolve(
      repoRoot,
      V138_BOUNDED_RETRY_PATHS.privateDir,
    )
    if (safeStatus(privateTarget) === "missing")
      mkdirSync(privateTarget, { mode: 0o700 })
    if (
      safeStatus(privateTarget) !== "directory" ||
      (statSync(privateTarget).mode & 0o777) !== 0o700
    ) {
      fail("V138_RETRY_PRIVATE_DIR_UNSAFE")
    }
    for (const repoPath of [
      V138_BOUNDED_RETRY_PATHS.terminal,
      V138_BOUNDED_RETRY_PATHS.reproduction,
    ]) {
      if (safeStatus(path.resolve(repoRoot, repoPath)) !== "missing") {
        fail("V138_RETRY_DESTINATION_PRESENT")
      }
    }
    const existing = readJournal(repoRoot)
    const appendJournal = journalAppender(repoRoot)
    const append = (record: V138RetryJournalRecord): void => {
      appendJournal(record)
      exclusiveWrite(
        path.join(
          privateTarget,
          `journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
        ),
        canonical(record),
      )
      fsyncParent(privateTarget)
    }
    const result = await runV138BoundedRetryController({
      envelope,
      owner: "repository_operator",
      records: existing,
      effects: createV138ProductionControllerEffects(repoRoot, append),
    })
    publishV138RetryTerminalResult(
      path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.terminal),
      result,
    )
    if (result.state.disposition === "succeeded") {
      exclusiveWrite(
        path.resolve(repoRoot, V138_BOUNDED_RETRY_PATHS.reproduction),
        canonical(result.reproductionArtifact),
      )
    }
  } finally {
    unlinkSync(lock)
    fsyncParent(lock)
  }
}

export interface V138BoundedRetryCliDependencies {
  readonly repoRoot: string
  readonly deriveArtifacts: () => Readonly<V138DerivedSealEnvelope>
  readonly runLive: () => Promise<void>
}

export const executeV138BoundedRetryCli = async (
  argv: readonly string[],
  injected?: Partial<V138BoundedRetryCliDependencies>,
): Promise<void> => {
  const repoRoot =
    injected?.repoRoot ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const deriveArtifacts =
    injected?.deriveArtifacts ??
    (() => deriveV138SealedInactiveEnvelope(repoRoot))
  const runLive = injected?.runLive ?? (() => runProductionLive(repoRoot))
  const command = argv[0]
  const rest = argv.slice(1)
  if (command === "--check-source-only" && rest.length === 0) {
    if (
      V138_BOUNDED_RETRY_POLICY.samplingMilliseconds !== 200 ||
      V138_BOUNDED_RETRY_POLICY.minimumEffectiveAvailableBasisPoints !== 2500 ||
      V138_BOUNDED_RETRY_IDENTITIES.routes.length !== 3 ||
      V138_BOUNDED_RETRY_IDENTITIES.preflights.length !== 12 ||
      V138_BOUNDED_RETRY_IDENTITIES.calibrations.length !== 24 ||
      V138_BOUNDED_RETRY_IDENTITIES.reproduction.length !== 540
    ) {
      fail("V138_RETRY_SOURCE_INVALID")
    }
    for (const repoPath of [
      V138_BOUNDED_RETRY_PATHS.journal,
      V138_BOUNDED_RETRY_PATHS.terminal,
      V138_BOUNDED_RETRY_PATHS.privateDir,
      V138_BOUNDED_RETRY_PATHS.reproduction,
    ]) {
      if (safeStatus(path.resolve(repoRoot, repoPath)) !== "missing") {
        fail("V138_RETRY_LIVE_DESTINATION_PRESENT")
      }
    }
    process.stdout.write(
      '{"status":"passed","liveInvoked":false,"freshCharged":0,"freshAccepted":0,"downstreamAuthority":"denied"}\n',
    )
    return
  }
  if (command === "--derive-seal-envelope-no-publish" && rest.length === 0) {
    const artifacts = deriveArtifacts()
    process.stdout.write(
      `${JSON.stringify({
        sealRoot: artifacts.seal.sealRoot,
        envelopeRoot: artifacts.envelope.envelopeRoot,
        status: "sealed_inactive_not_published",
        freshCharged: 0,
        freshAccepted: 0,
        downstreamAuthority: "denied",
      })}\n`,
    )
    return
  }
  if (command === "--publish-sealed-inactive-envelope") {
    exactArgs(rest, PAIR_FLAGS)
    publishPair(repoRoot, deriveArtifacts())
    return
  }
  if (command === "--check-sealed-inactive-envelope") {
    exactArgs(rest, PAIR_FLAGS)
    checkPublishedPair(
      repoRoot,
      injected?.deriveArtifacts === undefined ? undefined : deriveArtifacts,
    )
    for (const repoPath of [
      V138_BOUNDED_RETRY_PATHS.journal,
      V138_BOUNDED_RETRY_PATHS.terminal,
      V138_BOUNDED_RETRY_PATHS.privateDir,
      V138_BOUNDED_RETRY_PATHS.reproduction,
    ]) {
      if (safeStatus(path.resolve(repoRoot, repoPath)) !== "missing") {
        fail("V138_RETRY_LIVE_DESTINATION_PRESENT")
      }
    }
    return
  }
  if (command === "--run-bounded-live-envelope") {
    exactArgs(rest, LIVE_FLAGS)
    await runLive()
    return
  }
  fail("V138_RETRY_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  executeV138BoundedRetryCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V138_RETRY_FAILED"}\n`,
    )
    process.exitCode = 1
  })
}
