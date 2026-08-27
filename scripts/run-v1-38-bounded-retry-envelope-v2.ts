import { Buffer } from "node:buffer"
import { execFile, execFileSync, spawn } from "node:child_process"
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
  V138_BOUNDED_RETRY_V2_IDENTITIES,
  V138_BOUNDED_RETRY_V2_POLICY,
  V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY,
  appendV138RetryV2JournalRecord,
  checkV138InactiveRetryV2Envelope,
  checkV138ProtectedHistoryV2,
  createV138InactiveRetryV2Envelope,
  deriveV138RetryV2State,
  encodeV138RetryV2CanonicalJson,
  requireV138RetryV2DestinationAbsent,
  type V138DerivedRetryV2State,
  type V138InactiveRetryV2Envelope,
  type V138RetryV2CalibrationIdentity,
  type V138RetryV2JournalEvent,
  type V138RetryV2JournalRecord,
  type V138RetryV2ReproductionIdentity,
  type V138RetryV2RouteIdentity,
  type V138RetrySha256,
} from "./lib/v1-38-bounded-retry-envelope-v2.js"
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
const canonical = encodeV138RetryV2CanonicalJson

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

export const V138_BOUNDED_RETRY_V2_PATHS = Object.freeze({
  sourceSummary: `${PHASE_DIR}/262-84-SUMMARY.md`,
  sourceController: "scripts/run-v1-38-bounded-retry-envelope-v2.ts",
  sourceModel: "scripts/lib/v1-38-bounded-retry-envelope-v2.ts",
  sourceTests: "scripts/run-v1-38-bounded-retry-envelope-v2.test.ts",
  sourceReview:
    ".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json",
  sourceReviewReport: `${PHASE_DIR}/262-85-REVIEW.md`,
  protectedHistoryCorrection:
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v2.json",
  historicalReceiptManifest:
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v1.json",
  historicalEnvelope:
    ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
  historicalJournal:
    ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
  historicalTerminal:
    ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  historicalSeal: ".planning/artifacts/v1.38-successor-source-seal-v11.json",
  historicalDisposition:
    ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
  historicalLifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v12.json",
  envelope: ".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json",
  localSeal:
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v2",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json",
})

export const V138_BOUNDED_RETRY_V2_PRODUCTION_MODES = Object.freeze([
  "--derive-seal-envelope-no-publish",
  "--publish-sealed-inactive-envelope",
  "--check-sealed-inactive-envelope",
  "--check-live-transition",
  "--check-terminal-envelope",
  "--run-bounded-live-envelope",
] as const)

type PreflightResult =
  | Readonly<{
      available: true
      effectiveAvailableBasisPoints: number
    }>
  | Readonly<{ available: false }>

export interface V138BoundedRetryV2ControllerEffects {
  readonly monotonicMilliseconds: () => number
  readonly waitUntil: (targetMilliseconds: number) => Promise<void>
  readonly observePreflight: () => Promise<PreflightResult>
  readonly runCalibration: (
    input: Readonly<{
      routeIdentity: V138RetryV2RouteIdentity
      identities: readonly V138RetryV2CalibrationIdentity[]
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
      routeIdentity: V138RetryV2RouteIdentity
      identities: readonly V138RetryV2ReproductionIdentity[]
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
  readonly appendDurableRecord: (record: V138RetryV2JournalRecord) => void
}

export interface V138BoundedRetryV2ControllerResult {
  readonly records: readonly V138RetryV2JournalRecord[]
  readonly state: Readonly<V138DerivedRetryV2State>
  readonly reproductionArtifact?: unknown
}

const recordFor = <K extends V138RetryV2JournalEvent["kind"]>(
  records: readonly V138RetryV2JournalRecord[],
  kind: K,
) =>
  records.filter(
    (record): record is Extract<V138RetryV2JournalRecord, { kind: K }> =>
      record.kind === kind,
  )

const waitTarget = (records: readonly V138RetryV2JournalRecord[]): number => {
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
          V138_BOUNDED_RETRY_V2_POLICY.refusalSpacingMilliseconds,
    calibrationFailure === undefined
      ? 0
      : calibrationFailure.atMilliseconds +
          V138_BOUNDED_RETRY_V2_POLICY.calibrationFailureBackoffMilliseconds,
  )
}

export const runV138BoundedRetryV2Controller = async (
  input: Readonly<{
    envelope: unknown
    owner: string
    records: readonly V138RetryV2JournalRecord[]
    effects: V138BoundedRetryV2ControllerEffects
  }>,
): Promise<Readonly<V138BoundedRetryV2ControllerResult>> => {
  const envelope = checkV138InactiveRetryV2Envelope(input.envelope)
  let records = [...input.records] as readonly V138RetryV2JournalRecord[]
  let reproductionArtifact: unknown
  const append = (event: V138RetryV2JournalEvent): void => {
    const next = appendV138RetryV2JournalRecord(
      records,
      event,
      input.effects.monotonicMilliseconds(),
      envelope.envelopeRoot,
    )
    const record = next.at(-1)!
    input.effects.appendDurableRecord(record)
    records = next
  }
  const finish = (): Readonly<V138BoundedRetryV2ControllerResult> =>
    Object.freeze({
      records: Object.freeze([...records]),
      state: deriveV138RetryV2State(envelope, records),
      ...(reproductionArtifact === undefined ? {} : { reproductionArtifact }),
    })
  const deadlineGuard = (): boolean => {
    const state = deriveV138RetryV2State(envelope, records)
    if (state.disposition !== "active") return true
    if (state.firstObservationMilliseconds === null) return false
    const now = input.effects.monotonicMilliseconds()
    if (
      now <
      state.firstObservationMilliseconds +
        V138_BOUNDED_RETRY_V2_POLICY.envelopeLifetimeMilliseconds
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
        const routeOrdinal = V138_BOUNDED_RETRY_V2_IDENTITIES.routes.indexOf(
          pendingRoute.identity,
        )
        const identities = V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(
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
    deriveV138RetryV2State(envelope, records).disposition === "active" &&
    admittedAwaitingReproduction !== undefined
  ) {
    const routeIdentity = admittedAwaitingReproduction.routeIdentity
    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_reproduction",
      routeIdentity,
      owner: admittedAwaitingReproduction.owner,
      identities: V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction,
    })
    if (deadlineGuard()) return finish()
    let reproduction: Awaited<
      ReturnType<V138BoundedRetryV2ControllerEffects["runReproduction"]>
    >
    try {
      reproduction = await input.effects.runReproduction({
        routeIdentity,
        identities: V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction,
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

  while (deriveV138RetryV2State(envelope, records).disposition === "active") {
    if (deadlineGuard()) return finish()
    const state = deriveV138RetryV2State(envelope, records)
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

    const admittedState = deriveV138RetryV2State(envelope, records)
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
      V138_BOUNDED_RETRY_V2_IDENTITIES.routes.indexOf(routeIdentity)
    const calibrationIdentities =
      V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(
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
      ReturnType<V138BoundedRetryV2ControllerEffects["runCalibration"]>
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
      identities: V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction,
    })
    if (deadlineGuard()) return finish()
    let reproduction: Awaited<
      ReturnType<V138BoundedRetryV2ControllerEffects["runReproduction"]>
    >
    try {
      reproduction = await input.effects.runReproduction({
        routeIdentity,
        identities: V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction,
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

const containedRepoTarget = (repoRoot: string, repoPath: string): string => {
  const root = path.resolve(repoRoot)
  const target = path.resolve(root, repoPath)
  const relative = path.relative(root, target)
  if (
    relative.length === 0 ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    fail("V138_RETRY_V2_PATH_ESCAPE")
  }
  let current = root
  const rootStatus = lstatSync(current)
  if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) {
    fail("V138_RETRY_V2_PARENT_UNSAFE")
  }
  for (const component of relative.split(path.sep).slice(0, -1)) {
    current = path.join(current, component)
    const status = lstatSync(current)
    if (!status.isDirectory() || status.isSymbolicLink()) {
      fail("V138_RETRY_V2_PARENT_UNSAFE")
    }
  }
  return target
}

const readNoFollow = (repoRoot: string, repoPath: string): Buffer => {
  const target = containedRepoTarget(repoRoot, repoPath)
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
  result: Readonly<V138BoundedRetryV2ControllerResult>,
) => {
  if (result.state.disposition === "active") {
    fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  }
  return Object.freeze({
    schemaVersion: "v1.38-current-matrix-retry-terminal-v2" as const,
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
    completeCleanup: result.state.completeCleanup,
    downstreamAuthority: "denied" as const,
    productionAuthorized: false as const,
  })
}

export const publishV138RetryV2TerminalResult = (
  target: string,
  result: Readonly<V138BoundedRetryV2ControllerResult>,
): void => {
  exclusiveWrite(target, canonical(v138RetryTerminalResult(result)))
  fsyncParent(target)
}

export interface V138RetryV2PublicationHooks {
  readonly afterReproductionWrite?: () => void
  readonly afterReproductionParentFsync?: () => void
  readonly afterTerminalWrite?: () => void
  readonly afterTerminalParentFsync?: () => void
}

const validateSuccessArtifact = (
  result: Readonly<V138BoundedRetryV2ControllerResult>,
  artifact: any,
): void => {
  const terminal = result.records.findLast(
    (record) => record.kind === "finish_reproduction",
  )
  if (
    result.state.disposition !== "succeeded" ||
    terminal?.kind !== "finish_reproduction" ||
    terminal.status !== "passed_exact" ||
    terminal.reproductionRoot === undefined ||
    artifact?.receiptRoot !== terminal.reproductionRoot ||
    artifact?.status !== "passed_exact" ||
    artifact?.acceptedCellCount !== 540 ||
    artifact?.completeCleanup !== true
  )
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
}

export const publishV138RetryV2Outcome = (args: {
  terminalTarget: string
  reproductionTarget: string
  result: Readonly<V138BoundedRetryV2ControllerResult>
  hooks?: V138RetryV2PublicationHooks
}): void => {
  const { result, hooks = {} } = args
  if (result.state.disposition === "active")
    fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  if (result.state.disposition === "succeeded") {
    const reproductionStatus = safeStatus(args.reproductionTarget)
    if (reproductionStatus === "missing") {
      validateSuccessArtifact(result, result.reproductionArtifact)
      exclusiveWrite(
        args.reproductionTarget,
        canonical(result.reproductionArtifact),
      )
      hooks.afterReproductionWrite?.()
      fsyncParent(args.reproductionTarget)
      hooks.afterReproductionParentFsync?.()
    } else if (reproductionStatus === "regular") {
      const artifact = JSON.parse(readFileSync(args.reproductionTarget, "utf8"))
      validateSuccessArtifact(result, artifact)
      if (
        result.reproductionArtifact !== undefined &&
        canonical(artifact) !== canonical(result.reproductionArtifact)
      )
        fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
    } else fail("V138_RETRY_DESTINATION_UNSAFE")
  } else if (safeStatus(args.reproductionTarget) !== "missing") {
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }

  const terminalStatus = safeStatus(args.terminalTarget)
  if (terminalStatus === "missing") {
    exclusiveWrite(
      args.terminalTarget,
      canonical(v138RetryTerminalResult(result)),
    )
    hooks.afterTerminalWrite?.()
    fsyncParent(args.terminalTarget)
    hooks.afterTerminalParentFsync?.()
  } else if (
    terminalStatus !== "regular" ||
    readFileSync(args.terminalTarget, "utf8") !==
      canonical(v138RetryTerminalResult(result))
  ) {
    fail("V138_RETRY_DUPLICATE_INVOCATION_INVALID")
  }
}

const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY)
  try {
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

export interface V138SuccessorSourceSealV12 {
  readonly schemaVersion: "v1.38-successor-source-seal-v12"
  readonly sourceBaseCommit: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0"
  readonly authorizationCommit: "453a33a10c247fb9c75e969ed4ab63646b16b488"
  readonly authorizationSoleParent: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0"
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
  readonly seal: Readonly<V138SuccessorSourceSealV12>
  readonly envelope: Readonly<V138InactiveRetryV2Envelope>
}

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }).trim()

const requireExactV2Lineage = (repoRoot: string): void => {
  const expected = checkV138ProtectedHistoryV2(
    V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY,
  )
  if (
    git(repoRoot, ["rev-parse", `${expected.sourceBase.commit}^{tree}`]) !==
      expected.sourceBase.tree ||
    git(repoRoot, ["rev-parse", `${expected.authorization.commit}^{tree}`]) !==
      expected.authorization.tree ||
    git(repoRoot, ["show", "-s", "--format=%P", expected.authorization.commit]) !==
      expected.authorization.soleParent
  ) {
    fail("V138_RETRY_V2_LINEAGE_INVALID")
  }
}

const requireProtectedV1Bytes = (repoRoot: string): void => {
  const expected = V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY
  const pathsAndHashes = [
    [V138_BOUNDED_RETRY_V2_PATHS.protectedHistoryCorrection, expected.correction.sha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalReceiptManifest, expected.historical.receiptManifestSha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalEnvelope, expected.historical.envelopeSha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalJournal, expected.historical.journalSha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalTerminal, expected.historical.terminalSha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalSeal, expected.historical.sealSha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalDisposition, expected.historical.dispositionSha256],
    [V138_BOUNDED_RETRY_V2_PATHS.historicalLifecycle, expected.historical.lifecycleSha256],
  ] as const
  for (const [repoPath, digest] of pathsAndHashes) {
    if (sha256(readNoFollow(repoRoot, repoPath)) !== digest) {
      fail("V138_RETRY_V2_PROTECTED_HISTORY_INVALID")
    }
  }
  const correction = readJsonNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_V2_PATHS.protectedHistoryCorrection,
  ) as Record<string, any>
  if (
    correction.correctionRoot !== expected.correction.root ||
    correction.effectiveAssurance?.status !== expected.correction.status ||
    correction.effectiveAssurance?.integrityPassed !== false ||
    correction.effectiveAssurance?.historicalBytesMutated !== false ||
    correction.empiricalOutcome?.freshAccepted !== 0 ||
    correction.empiricalOutcome?.requiredAccepted !== 540
  ) {
    fail("V138_RETRY_V2_PROTECTED_HISTORY_INVALID")
  }
}

export const deriveV138SealedInactiveEnvelope = (
  repoRoot: string,
  directParentCommit = git(repoRoot, ["rev-parse", "HEAD"]),
): Readonly<V138DerivedSealEnvelope> => {
  requireExactV2Lineage(repoRoot)
  requireProtectedV1Bytes(repoRoot)
  const sourcePaths = [
    V138_BOUNDED_RETRY_V2_PATHS.sourceSummary,
    V138_BOUNDED_RETRY_V2_PATHS.sourceController,
    V138_BOUNDED_RETRY_V2_PATHS.sourceModel,
    V138_BOUNDED_RETRY_V2_PATHS.sourceTests,
  ]
  const custodyPaths = [
    ...sourcePaths,
    V138_BOUNDED_RETRY_V2_PATHS.sourceReview,
    V138_BOUNDED_RETRY_V2_PATHS.sourceReviewReport,
    V138_BOUNDED_RETRY_V2_PATHS.localSeal,
    V138_BOUNDED_RETRY_V2_PATHS.protectedHistoryCorrection,
    V138_BOUNDED_RETRY_V2_PATHS.historicalReceiptManifest,
    V138_BOUNDED_RETRY_V2_PATHS.historicalEnvelope,
    V138_BOUNDED_RETRY_V2_PATHS.historicalJournal,
    V138_BOUNDED_RETRY_V2_PATHS.historicalTerminal,
    V138_BOUNDED_RETRY_V2_PATHS.historicalSeal,
    V138_BOUNDED_RETRY_V2_PATHS.historicalDisposition,
    V138_BOUNDED_RETRY_V2_PATHS.historicalLifecycle,
  ]
  if (git(repoRoot, ["status", "--porcelain", "--", ...custodyPaths]) !== "") {
    fail("V138_RETRY_SOURCE_DIRTY")
  }
  for (const repoPath of custodyPaths) {
    const working = readNoFollow(repoRoot, repoPath)
    let committed: Buffer
    try {
      committed = execFileSync("git", ["show", `${directParentCommit}:${repoPath}`], {
        cwd: repoRoot,
        maxBuffer: 8 * 1024 * 1024,
      })
    } catch {
      return fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
    }
    if (!working.equals(committed)) fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  }
  const reviewBytes = readNoFollow(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.sourceReview)
  const review = JSON.parse(reviewBytes.toString("utf8")) as Record<string, unknown>
  if (
    review.findingCount !== 0 ||
    !["passed", "passed_exact", "zero_findings"].includes(String(review.status)) ||
    review.productionAuthorized === true
  ) fail("V138_RETRY_REVIEW_INVALID")
  const reviewRoot =
    typeof review.reviewRoot === "string" && /^sha256:[0-9a-f]{64}$/u.test(review.reviewRoot)
      ? (review.reviewRoot as V138RetrySha256)
      : sha256(reviewBytes)
  const localSeal = readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.localSeal) as Record<string, unknown>
  if (
    localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true ||
    localSeal.independentCustodyClaimed !== false ||
    typeof localSeal.verificationRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(localSeal.verificationRoot)
  ) fail("V138_RETRY_LOCAL_SEAL_INVALID")
  const sourceBytes = sourcePaths.map((repoPath) => ({
    repoPath,
    sha256: sha256(readNoFollow(repoRoot, repoPath)),
  }))
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v12" as const,
    sourceBaseCommit: V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.sourceBase.commit,
    authorizationCommit: V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.authorization.commit,
    authorizationSoleParent:
      V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.authorization.soleParent,
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
      V138_BOUNDED_RETRY_V2_PATHS.sourceReview,
      V138_BOUNDED_RETRY_V2_PATHS.sourceReviewReport,
    ]),
    localSealVerificationRoot: localSeal.verificationRoot as V138RetrySha256,
    protectedHistoryRoot:
      V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedHistoryRoot,
    directChild: true as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const seal = Object.freeze({
    ...body,
    sealRoot: sha256(`v138-successor-source-seal-v12\0${canonical(body)}`),
  })
  return Object.freeze({
    seal,
    envelope: createV138InactiveRetryV2Envelope({
      sourceRoot: seal.sourceRoot,
      reviewRoot: seal.reviewRoot,
      sealRoot: seal.sealRoot,
      protectedHistoryRoot: seal.protectedHistoryRoot,
      protectedHistoricalIdentities:
        V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedIdentities,
    }),
  })
}

const publishPair = (
  repoRoot: string,
  artifacts: V138DerivedSealEnvelope,
): void => {
  const seal = path.resolve(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.seal)
  const envelope = path.resolve(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.envelope)
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
    V138_BOUNDED_RETRY_V2_PATHS.seal,
  ) as V138SuccessorSourceSealV12
  const envelopeValue = checkV138InactiveRetryV2Envelope(
    readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.envelope),
  )
  let expected: Readonly<V138DerivedSealEnvelope>
  if (injectedDerivation !== undefined) expected = injectedDerivation()
  else {
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
      V138_BOUNDED_RETRY_V2_PATHS.seal,
    ])
    if (
      git(repoRoot, [
        "status",
        "--porcelain",
        "--",
        V138_BOUNDED_RETRY_V2_PATHS.seal,
        V138_BOUNDED_RETRY_V2_PATHS.envelope,
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

const buildV138ReproductionV16 = (
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
    schemaVersion: "v1.38-current-matrix-reproduction-v16" as const,
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
      `v138-current-matrix-reproduction-v16\0${canonical(body)}`,
    ),
  })
}

export const createV138ProductionControllerEffects = (
  repoRoot: string,
  appendDurableRecord: (record: V138RetryV2JournalRecord) => void,
): V138BoundedRetryV2ControllerEffects => {
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
      const artifact = buildV138ReproductionV16({
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

const readJournal = (repoRoot: string): readonly V138RetryV2JournalRecord[] => {
  const target = path.resolve(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.journal)
  if (safeStatus(target) === "missing") return []
  const text = readNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_V2_PATHS.journal,
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
): ((record: V138RetryV2JournalRecord) => void) => {
  const target = path.resolve(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.journal)
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

type V138RetryV2CrashBoundary =
  | "lock_acquired"
  | "journal_fsync"
  | "receipt_fsync"
  | "reproduction_write"
  | "reproduction_fsync"
  | "terminal_write"
  | "terminal_fsync"

export const acquireV138RetryV2OwnerLease = async (
  lock: string,
): Promise<
  Readonly<{
    pid: number
    waitForExit: () => Promise<number | null>
    release: () => Promise<void>
  }>
> => {
  const status = safeStatus(lock)
  if (status === "missing") {
    exclusiveWrite(lock, "")
    fsyncParent(lock)
  } else if (status !== "regular") fail("V138_RETRY_OWNER_LOCK_UNSAFE")
  const child = spawn(
    "/usr/bin/lockf",
    ["-t", "0", lock, "/bin/sh", "-c", 'printf "acquired\\n"; cat >/dev/null'],
    { stdio: ["pipe", "pipe", "pipe"] },
  )
  const childPid = child.pid ?? fail("V138_RETRY_OWNER_LOCK_ACTIVE")
  const exit = new Promise<number | null>((resolve) =>
    child.once("exit", resolve),
  )
  await new Promise<void>((resolve, reject) => {
    let stdout = ""
    let stderr = ""
    let settled = false
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      if (error) reject(error)
      else resolve()
    }
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
      if (stdout.includes("acquired\n")) finish()
    })
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk
    })
    child.once("error", (error) => finish(error))
    child.once("exit", () =>
      finish(new TypeError(`V138_RETRY_OWNER_LOCK_ACTIVE:${stderr.trim()}`)),
    )
  })
  let released = false
  return Object.freeze({
    pid: childPid,
    waitForExit: () => exit,
    release: async () => {
      if (released) fail("V138_RETRY_OWNER_LOCK_RELEASE_INVALID")
      released = true
      child.stdin.end()
      const code = await exit
      if (code !== 0) fail("V138_RETRY_OWNER_LOCK_RELEASE_INVALID")
    },
  })
}

export const reconcileV138RetryPrivateReceipts = (
  privateTarget: string,
  records: readonly V138RetryV2JournalRecord[],
): number => {
  let restored = 0
  for (const record of records) {
    const receipt = path.join(
      privateTarget,
      `journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
    )
    const expected = canonical(record)
    const status = safeStatus(receipt)
    if (status === "missing") {
      exclusiveWrite(receipt, expected)
      fsyncParent(receipt)
      restored += 1
    } else if (
      status !== "regular" ||
      (statSync(receipt).mode & 0o777) !== 0o600 ||
      readFileSync(receipt, "utf8") !== expected
    ) {
      fail("V138_RETRY_PRIVATE_RECEIPT_INVALID")
    }
  }
  return restored
}

export const checkV138PublishedRetryOutcome = (
  repoRoot: string,
): Readonly<{
  disposition: V138DerivedRetryV2State["disposition"]
  journalRoot: V138RetrySha256
  stateRoot: V138RetrySha256
  completeCleanup: boolean
  reproductionPresent: boolean
  downstreamAuthority: "denied"
}> => {
  const { envelope } = checkPublishedPair(repoRoot)
  const records = readJournal(repoRoot)
  const state = deriveV138RetryV2State(envelope, records)
  if (state.disposition === "active") fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  const privateTarget = path.resolve(
    repoRoot,
    V138_BOUNDED_RETRY_V2_PATHS.privateDir,
  )
  if (
    safeStatus(privateTarget) !== "directory" ||
    (statSync(privateTarget).mode & 0o777) !== 0o700
  )
    fail("V138_RETRY_PRIVATE_DIR_UNSAFE")
  for (const record of records) {
    const receiptPath = path.join(
      privateTarget,
      `journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
    )
    if (
      safeStatus(receiptPath) !== "regular" ||
      (statSync(receiptPath).mode & 0o777) !== 0o600 ||
      readFileSync(receiptPath, "utf8") !== canonical(record)
    )
      fail("V138_RETRY_PRIVATE_RECEIPT_INVALID")
  }
  const terminal = readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.terminal)
  if (
    canonical(terminal) !==
    canonical(v138RetryTerminalResult({ records, state }))
  )
    fail("V138_RETRY_TERMINAL_INVALID")
  const reproductionStatus = safeStatus(
    path.resolve(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.reproduction),
  )
  if (
    (state.disposition === "succeeded") !==
    (reproductionStatus === "regular")
  )
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  if (reproductionStatus === "regular") {
    validateSuccessArtifact(
      { records, state },
      readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.reproduction),
    )
  } else if (reproductionStatus !== "missing") {
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }
  return Object.freeze({
    disposition: state.disposition,
    journalRoot: state.journalRoot,
    stateRoot: state.stateRoot,
    completeCleanup: state.completeCleanup,
    reproductionPresent: reproductionStatus === "regular",
    downstreamAuthority: "denied" as const,
  })
}

export const requireV138RetryV2ReproductionAbsent = (repoRoot: string): true => {
  try {
    requireV138RetryV2DestinationAbsent(
      repoRoot,
      V138_BOUNDED_RETRY_V2_PATHS.reproduction,
    )
  } catch {
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }
  return true
}

export interface V138RetryV2ProductionOptions {
  readonly checkPair?: () => Readonly<V138DerivedSealEnvelope>
  readonly createEffects?: (
    append: (record: V138RetryV2JournalRecord) => void,
  ) => V138BoundedRetryV2ControllerEffects
  readonly crashBoundary?: (stage: V138RetryV2CrashBoundary) => void
  readonly validateInputs?: boolean
}

export const runV138V2ProductionLive = async (
  repoRoot: string,
  options: V138RetryV2ProductionOptions = {},
): Promise<void> => {
  const { envelope } = options.checkPair?.() ?? checkPublishedPair(repoRoot)
  for (const repoPath of [
    V138_BOUNDED_RETRY_V2_PATHS.journal,
    `${V138_BOUNDED_RETRY_V2_PATHS.journal}.lock`,
    V138_BOUNDED_RETRY_V2_PATHS.terminal,
    V138_BOUNDED_RETRY_V2_PATHS.privateDir,
    V138_BOUNDED_RETRY_V2_PATHS.reproduction,
  ]) containedRepoTarget(repoRoot, repoPath)
  if (options.validateInputs !== false)
    for (const repoPath of [
      V138_BOUNDED_RETRY_V2_PATHS.sourceSummary,
      V138_BOUNDED_RETRY_V2_PATHS.sourceController,
      V138_BOUNDED_RETRY_V2_PATHS.sourceModel,
      V138_BOUNDED_RETRY_V2_PATHS.sourceTests,
      V138_BOUNDED_RETRY_V2_PATHS.sourceReview,
      V138_BOUNDED_RETRY_V2_PATHS.sourceReviewReport,
      V138_BOUNDED_RETRY_V2_PATHS.seal,
      V138_BOUNDED_RETRY_V2_PATHS.envelope,
      V138_BOUNDED_RETRY_V2_PATHS.localSeal,
      V138_BOUNDED_RETRY_V2_PATHS.protectedHistoryCorrection,
      V138_BOUNDED_RETRY_V2_PATHS.historicalReceiptManifest,
      V138_BOUNDED_RETRY_V2_PATHS.historicalEnvelope,
      V138_BOUNDED_RETRY_V2_PATHS.historicalJournal,
      V138_BOUNDED_RETRY_V2_PATHS.historicalTerminal,
      V138_BOUNDED_RETRY_V2_PATHS.historicalSeal,
      V138_BOUNDED_RETRY_V2_PATHS.historicalDisposition,
      V138_BOUNDED_RETRY_V2_PATHS.historicalLifecycle,
    ])
      readNoFollow(repoRoot, repoPath)
  const terminalTarget = path.resolve(
    repoRoot,
    V138_BOUNDED_RETRY_V2_PATHS.terminal,
  )
  const lock = path.resolve(
    repoRoot,
    `${V138_BOUNDED_RETRY_V2_PATHS.journal}.lock`,
  )
  const terminalStatus = safeStatus(terminalTarget)
  if (terminalStatus === "unsafe" || terminalStatus === "directory") {
    fail("V138_RETRY_DESTINATION_UNSAFE")
  }
  if (terminalStatus === "regular") {
    const ownership = await acquireV138RetryV2OwnerLease(lock)
    try {
      const terminal = readJsonNoFollow(
        repoRoot,
        V138_BOUNDED_RETRY_V2_PATHS.terminal,
      ) as Record<string, unknown>
      const records = readJournal(repoRoot)
      const state = deriveV138RetryV2State(envelope, records)
      const expectedTerminal = v138RetryTerminalResult({ records, state })
      const reproductionStatus = safeStatus(
        path.resolve(repoRoot, V138_BOUNDED_RETRY_V2_PATHS.reproduction),
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
    } finally {
      await ownership.release()
    }
    return
  }
  const ownership = await acquireV138RetryV2OwnerLease(lock)
  try {
    options.crashBoundary?.("lock_acquired")
    const privateTarget = path.resolve(
      repoRoot,
      V138_BOUNDED_RETRY_V2_PATHS.privateDir,
    )
    if (safeStatus(privateTarget) === "missing")
      mkdirSync(privateTarget, { mode: 0o700 })
    if (
      safeStatus(privateTarget) !== "directory" ||
      (statSync(privateTarget).mode & 0o777) !== 0o700
    ) {
      fail("V138_RETRY_PRIVATE_DIR_UNSAFE")
    }
    const existing = readJournal(repoRoot)
    reconcileV138RetryPrivateReceipts(privateTarget, existing)
    const existingState = deriveV138RetryV2State(envelope, existing)
    const reproductionTarget = path.resolve(
      repoRoot,
      V138_BOUNDED_RETRY_V2_PATHS.reproduction,
    )
    if (safeStatus(reproductionTarget) === "regular") {
      publishV138RetryV2Outcome({
        terminalTarget,
        reproductionTarget,
        result: { records: existing, state: existingState },
      })
      return
    }
    if (safeStatus(reproductionTarget) !== "missing")
      fail("V138_RETRY_DESTINATION_UNSAFE")
    const appendJournal = journalAppender(repoRoot)
    const append = (record: V138RetryV2JournalRecord): void => {
      appendJournal(record)
      options.crashBoundary?.("journal_fsync")
      exclusiveWrite(
        path.join(
          privateTarget,
          `journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
        ),
        canonical(record),
      )
      fsyncParent(privateTarget)
      options.crashBoundary?.("receipt_fsync")
    }
    const result = await runV138BoundedRetryV2Controller({
      envelope,
      owner: "repository_operator",
      records: existing,
      effects:
        options.createEffects?.(append) ??
        createV138ProductionControllerEffects(repoRoot, append),
    })
    publishV138RetryV2Outcome({
      terminalTarget,
      reproductionTarget,
      result,
      hooks: {
        afterReproductionWrite: () =>
          options.crashBoundary?.("reproduction_write"),
        afterReproductionParentFsync: () =>
          options.crashBoundary?.("reproduction_fsync"),
        afterTerminalWrite: () => options.crashBoundary?.("terminal_write"),
        afterTerminalParentFsync: () =>
          options.crashBoundary?.("terminal_fsync"),
      },
    })
  } finally {
    await ownership.release()
  }
}

export interface V138BoundedRetryV2CliDependencies {
  readonly repoRoot: string
  readonly deriveArtifacts: () => Readonly<V138DerivedSealEnvelope>
  readonly runLive: () => Promise<void>
  readonly checkOutcome: () => ReturnType<typeof checkV138PublishedRetryOutcome>
}

export const executeV138BoundedRetryV2Cli = async (
  argv: readonly string[],
  injected?: Partial<V138BoundedRetryV2CliDependencies>,
): Promise<void> => {
  const repoRoot =
    injected?.repoRoot ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const deriveArtifacts =
    injected?.deriveArtifacts ??
    (() => deriveV138SealedInactiveEnvelope(repoRoot))
  const runLive = injected?.runLive ?? (() => runV138V2ProductionLive(repoRoot))
  const checkOutcome =
    injected?.checkOutcome ?? (() => checkV138PublishedRetryOutcome(repoRoot))
  const command = argv[0]
  const rest = argv.slice(1)
  if (command === "--check-source-only" && rest.length === 0) {
    if (
      V138_BOUNDED_RETRY_V2_POLICY.samplingMilliseconds !== 200 ||
      V138_BOUNDED_RETRY_V2_POLICY.minimumEffectiveAvailableBasisPoints !== 2500 ||
      V138_BOUNDED_RETRY_V2_IDENTITIES.routes.length !== 3 ||
      V138_BOUNDED_RETRY_V2_IDENTITIES.preflights.length !== 12 ||
      V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.length !== 24 ||
      V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction.length !== 540
    ) {
      fail("V138_RETRY_SOURCE_INVALID")
    }
    for (const repoPath of [
      V138_BOUNDED_RETRY_V2_PATHS.journal,
      V138_BOUNDED_RETRY_V2_PATHS.terminal,
      V138_BOUNDED_RETRY_V2_PATHS.privateDir,
      V138_BOUNDED_RETRY_V2_PATHS.reproduction,
    ]) {
      try {
        requireV138RetryV2DestinationAbsent(repoRoot, repoPath)
      } catch {
        fail("V138_RETRY_LIVE_DESTINATION_PRESENT")
      }
    }
    process.stdout.write(
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
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    publishPair(repoRoot, deriveArtifacts())
    return
  }
  if (command === "--check-sealed-inactive-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    checkPublishedPair(
      repoRoot,
      injected?.deriveArtifacts === undefined ? undefined : deriveArtifacts,
    )
    for (const repoPath of [
      V138_BOUNDED_RETRY_V2_PATHS.journal,
      V138_BOUNDED_RETRY_V2_PATHS.terminal,
      V138_BOUNDED_RETRY_V2_PATHS.privateDir,
      V138_BOUNDED_RETRY_V2_PATHS.reproduction,
    ]) {
      try {
        requireV138RetryV2DestinationAbsent(repoRoot, repoPath)
      } catch {
        fail("V138_RETRY_LIVE_DESTINATION_PRESENT")
      }
    }
    return
  }
  if (command === "--run-bounded-live-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    await runLive()
    return
  }
  if (command === "--check-live-transition") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    const checked = checkOutcome()
    process.stdout.write(`${JSON.stringify(checked)}\n`)
    return
  }
  if (command === "--check-terminal-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    const checked = checkOutcome()
    process.stdout.write(`${JSON.stringify(checked)}\n`)
    return
  }
  fail("V138_RETRY_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  executeV138BoundedRetryV2Cli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V138_RETRY_FAILED"}\n`,
    )
    process.exitCode = 1
  })
}
