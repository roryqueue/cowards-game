import { createHash } from "node:crypto"

export type V138RetrySha256 = `sha256:${string}`
export type V138RetryRouteIdentity = `route:v1:${0 | 1 | 2}`
export type V138RetryPreflightIdentity = `preflight:v1:${number}`
export type V138RetryCalibrationIdentity =
  `calibration:v1:${0 | 1 | 2}:${number}`
export type V138RetryReproductionIdentity = `reproduction:v1:${number}`

const sha256 = (value: string): V138RetrySha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value as Readonly<T>
}

const fail = (code: string): never => {
  throw new TypeError(code)
}
const isSha256 = (value: unknown): value is V138RetrySha256 =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)

export const V138_BOUNDED_RETRY_POLICY = deepFreeze({
  schemaVersion: "retry-envelope:v1" as const,
  maximumRouteStarts: 3 as const,
  maximumPreflightObservations: 12 as const,
  envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000,
  refusalSpacingMilliseconds: 5 * 60 * 1_000,
  calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000,
  calibrationAttemptsPerRoute: 8 as const,
  calibrationShardCount: 4 as const,
  samplingMilliseconds: 200 as const,
  minimumEffectiveAvailableBasisPoints: 2_500 as const,
  reproductionCellCount: 540 as const,
  maximumReproductionRuns: 1 as const,
  rulesAuthority: "MATCH_KERNEL" as const,
  supervisedRuntimeOnly: true as const,
  assuranceClass: "single_operator_local_seal_v1" as const,
  partialAcceptedEvidenceReusable: false as const,
  phase263PlanningAuthorized: false as const,
  candidateSearchAuthorized: false as const,
  formationMaterializationAuthorized: false as const,
  holdoutOpeningAuthorized: false as const,
  publicAuthorized: false as const,
  productAuthorized: false as const,
  productionAuthorized: false as const,
  gameplayChangeAuthorized: false as const,
})

const routes = Array.from(
  { length: 3 },
  (_, ordinal) => `route:v1:${ordinal}` as V138RetryRouteIdentity,
)
const preflights = Array.from(
  { length: 12 },
  (_, ordinal) => `preflight:v1:${ordinal}` as V138RetryPreflightIdentity,
)
const calibrations = routes.flatMap((_, routeOrdinal) =>
  Array.from(
    { length: 8 },
    (_, attemptOrdinal) =>
      `calibration:v1:${routeOrdinal}:${attemptOrdinal}` as V138RetryCalibrationIdentity,
  ),
)
const reproduction = Array.from(
  { length: 540 },
  (_, ordinal) => `reproduction:v1:${ordinal}` as V138RetryReproductionIdentity,
)

export const V138_BOUNDED_RETRY_IDENTITIES = deepFreeze({
  routes,
  preflights,
  calibrations,
  reproduction,
})

export interface V138InactiveRetryEnvelope {
  readonly schemaVersion: "retry-envelope:v1"
  readonly status: "sealed_inactive"
  readonly sourceRoot: V138RetrySha256
  readonly reviewRoot: V138RetrySha256
  readonly sealRoot: V138RetrySha256
  readonly protectedHistoryRoot: V138RetrySha256
  readonly protectedHistoricalIdentities: readonly string[]
  readonly policy: typeof V138_BOUNDED_RETRY_POLICY
  readonly counters: Readonly<{
    preflightObservationsConsumed: 0
    routeStartsConsumed: 0
    calibrationIdentitiesCharged: 0
    reproductionIdentitiesCharged: 0
    acceptedCells: 0
  }>
  readonly envelopeRoot: V138RetrySha256
}

export const createV138InactiveRetryEnvelope = (
  input: Readonly<{
    sourceRoot: V138RetrySha256
    reviewRoot: V138RetrySha256
    sealRoot: V138RetrySha256
    protectedHistoryRoot: V138RetrySha256
    protectedHistoricalIdentities: readonly string[]
  }>,
): Readonly<V138InactiveRetryEnvelope> => {
  if (
    ![
      input.sourceRoot,
      input.reviewRoot,
      input.sealRoot,
      input.protectedHistoryRoot,
    ].every(isSha256) ||
    !Array.isArray(input.protectedHistoricalIdentities) ||
    new Set(input.protectedHistoricalIdentities).size !==
      input.protectedHistoricalIdentities.length ||
    input.protectedHistoricalIdentities.some(
      (identity) =>
        typeof identity !== "string" ||
        identity.length === 0 ||
        routes.includes(identity as V138RetryRouteIdentity) ||
        preflights.includes(identity as V138RetryPreflightIdentity) ||
        calibrations.includes(identity as V138RetryCalibrationIdentity) ||
        reproduction.includes(identity as V138RetryReproductionIdentity),
    )
  ) {
    return fail("V138_RETRY_ENVELOPE_INPUT_INVALID")
  }
  const body = {
    schemaVersion: "retry-envelope:v1" as const,
    status: "sealed_inactive" as const,
    sourceRoot: input.sourceRoot,
    reviewRoot: input.reviewRoot,
    sealRoot: input.sealRoot,
    protectedHistoryRoot: input.protectedHistoryRoot,
    protectedHistoricalIdentities: [...input.protectedHistoricalIdentities],
    policy: V138_BOUNDED_RETRY_POLICY,
    counters: {
      preflightObservationsConsumed: 0 as const,
      routeStartsConsumed: 0 as const,
      calibrationIdentitiesCharged: 0 as const,
      reproductionIdentitiesCharged: 0 as const,
      acceptedCells: 0 as const,
    },
  }
  return deepFreeze({
    ...body,
    envelopeRoot: sha256(`v138-retry-envelope-v1\0${canonical(body)}`),
  })
}

export const checkV138InactiveRetryEnvelope = (
  value: unknown,
): Readonly<V138InactiveRetryEnvelope> => {
  const candidate = value as V138InactiveRetryEnvelope
  try {
    const expected = createV138InactiveRetryEnvelope({
      sourceRoot: candidate.sourceRoot,
      reviewRoot: candidate.reviewRoot,
      sealRoot: candidate.sealRoot,
      protectedHistoryRoot: candidate.protectedHistoryRoot,
      protectedHistoricalIdentities: candidate.protectedHistoricalIdentities,
    })
    if (canonical(candidate) !== canonical(expected)) throw new TypeError()
    return candidate
  } catch {
    return fail("V138_RETRY_ENVELOPE_INVALID")
  }
}

type ReservePreflight = Readonly<{
  kind: "reserve_preflight"
  identity: V138RetryPreflightIdentity
  owner: string
}>
type ObservePreflight = Readonly<{
  kind: "observe_preflight"
  identity: V138RetryPreflightIdentity
  owner: string
  effectiveAvailableBasisPoints: number
}>
type ReserveRoute = Readonly<{
  kind: "reserve_route"
  identity: V138RetryRouteIdentity
  owner: string
  preflightIdentity: V138RetryPreflightIdentity
}>
type ReserveCalibration = Readonly<{
  kind: "reserve_calibration"
  routeIdentity: V138RetryRouteIdentity
  owner: string
  identities: readonly V138RetryCalibrationIdentity[]
}>
type FinishCalibration = Readonly<{
  kind: "finish_calibration"
  routeIdentity: V138RetryRouteIdentity
  owner: string
  status: "admitted" | "system_failure"
  completeCleanup: boolean
  supervisionRoot?: V138RetrySha256
}>
type ReserveReproduction = Readonly<{
  kind: "reserve_reproduction"
  routeIdentity: V138RetryRouteIdentity
  owner: string
  identities: readonly V138RetryReproductionIdentity[]
}>
type FinishReproduction = Readonly<{
  kind: "finish_reproduction"
  routeIdentity: V138RetryRouteIdentity
  owner: string
  status: "passed_exact" | "system_failure"
  acceptedCells: number
  completeCleanup: boolean
  reproductionRoot?: V138RetrySha256
}>
type TimeWindowExpired = Readonly<{
  kind: "time_window_expired"
  owner: string
  reason: "time_window_expired"
}>

export type V138RetryJournalEvent =
  | ReservePreflight
  | ObservePreflight
  | ReserveRoute
  | ReserveCalibration
  | FinishCalibration
  | ReserveReproduction
  | FinishReproduction
  | TimeWindowExpired

export type V138RetryJournalRecord = Readonly<
  V138RetryJournalEvent & {
    schemaVersion: "v1.38-bounded-retry-journal-record-v1"
    ordinal: number
    atMilliseconds: number
    envelopeRoot: V138RetrySha256
    previousRoot: V138RetrySha256
    recordRoot: V138RetrySha256
  }
>

const GENESIS_ROOT = sha256("v138-bounded-retry-journal-genesis-v1")

type ReplayState = {
  preflightReservations: Map<V138RetryPreflightIdentity, string>
  preflightObservations: Map<V138RetryPreflightIdentity, number>
  routeReservations: Map<V138RetryRouteIdentity, string>
  routePreflights: Map<V138RetryRouteIdentity, V138RetryPreflightIdentity>
  calibrationReservations: Map<
    V138RetryRouteIdentity,
    readonly V138RetryCalibrationIdentity[]
  >
  calibrationTerminals: Map<V138RetryRouteIdentity, FinishCalibration>
  reproductionRoute: V138RetryRouteIdentity | null
  reproductionReserved: boolean
  reproductionTerminal: FinishReproduction | null
  timeWindowExpiryTerminal: TimeWindowExpired | null
  firstObservationMilliseconds: number | null
  lastRefusalMilliseconds: number | null
  lastProcessValidCalibrationFailureMilliseconds: number | null
  integrityFailure: boolean
}

const emptyReplay = (): ReplayState => ({
  preflightReservations: new Map(),
  preflightObservations: new Map(),
  routeReservations: new Map(),
  routePreflights: new Map(),
  calibrationReservations: new Map(),
  calibrationTerminals: new Map(),
  reproductionRoute: null,
  reproductionReserved: false,
  reproductionTerminal: null,
  timeWindowExpiryTerminal: null,
  firstObservationMilliseconds: null,
  lastRefusalMilliseconds: null,
  lastProcessValidCalibrationFailureMilliseconds: null,
  integrityFailure: false,
})

const assertOwner = (owner: unknown): asserts owner is string => {
  if (typeof owner !== "string" || owner.length === 0 || owner.length > 128) {
    fail("V138_RETRY_OWNER_INVALID")
  }
}

const terminalDisposition = (
  state: ReplayState,
): "active" | "succeeded" | "terminal_failure" | "exhausted" => {
  if (state.timeWindowExpiryTerminal !== null) return "exhausted"
  if (state.reproductionTerminal !== null) {
    return state.reproductionTerminal.status === "passed_exact" &&
      state.reproductionTerminal.acceptedCells === 540 &&
      state.reproductionTerminal.completeCleanup
      ? "succeeded"
      : "terminal_failure"
  }
  if (state.integrityFailure) return "terminal_failure"
  if (
    state.preflightObservations.size === 12 &&
    state.preflightReservations.size === 12 &&
    [...state.preflightObservations.values()].every(
      (basisPoints) => basisPoints < 2_500,
    )
  )
    return "exhausted"
  if (
    state.routeReservations.size === 3 &&
    [...state.routeReservations.keys()].every((identity) =>
      state.calibrationTerminals.has(identity),
    ) &&
    [...state.calibrationTerminals.values()].every(
      ({ status }) => status === "system_failure",
    )
  )
    return "exhausted"
  return "active"
}

const applyEvent = (
  state: ReplayState,
  event: V138RetryJournalEvent,
  atMilliseconds: number,
): void => {
  if (!Number.isSafeInteger(atMilliseconds) || atMilliseconds < 0) {
    fail("V138_RETRY_TIME_INVALID")
  }
  if (terminalDisposition(state) !== "active") {
    fail("V138_RETRY_ENVELOPE_TERMINAL")
  }
  assertOwner(event.owner)
  if (event.kind === "time_window_expired") {
    if (
      event.reason !== "time_window_expired" ||
      state.firstObservationMilliseconds === null ||
      atMilliseconds <
        state.firstObservationMilliseconds +
          V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
    ) {
      fail("V138_RETRY_TIME_WINDOW_ACTIVE")
    }
    state.timeWindowExpiryTerminal = event
    return
  }
  if (
    state.firstObservationMilliseconds !== null &&
    atMilliseconds >=
      state.firstObservationMilliseconds +
        V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
  ) {
    fail("V138_RETRY_ENVELOPE_EXPIRED")
  }
  if (event.kind === "reserve_preflight") {
    const next = preflights[state.preflightReservations.size]
    if (event.identity !== next) {
      if (state.preflightReservations.has(event.identity)) {
        fail("V138_RETRY_IDENTITY_ALREADY_CHARGED")
      }
      fail("V138_RETRY_IDENTITY_INVALID")
    }
    if (
      state.lastRefusalMilliseconds !== null &&
      atMilliseconds <
        state.lastRefusalMilliseconds +
          V138_BOUNDED_RETRY_POLICY.refusalSpacingMilliseconds
    ) {
      fail("V138_RETRY_REFUSAL_SPACING_REQUIRED")
    }
    if (
      state.lastProcessValidCalibrationFailureMilliseconds !== null &&
      atMilliseconds <
        state.lastProcessValidCalibrationFailureMilliseconds +
          V138_BOUNDED_RETRY_POLICY.calibrationFailureBackoffMilliseconds
    ) {
      fail("V138_RETRY_CALIBRATION_BACKOFF_REQUIRED")
    }
    state.preflightReservations.set(event.identity, event.owner)
    return
  }
  if (event.kind === "observe_preflight") {
    if (
      state.preflightReservations.get(event.identity) !== event.owner ||
      state.preflightObservations.has(event.identity) ||
      !Number.isSafeInteger(event.effectiveAvailableBasisPoints) ||
      event.effectiveAvailableBasisPoints < 0 ||
      event.effectiveAvailableBasisPoints > 10_000
    ) {
      fail("V138_RETRY_PREFLIGHT_OBSERVATION_INVALID")
    }
    state.preflightObservations.set(
      event.identity,
      event.effectiveAvailableBasisPoints,
    )
    state.firstObservationMilliseconds ??= atMilliseconds
    if (
      event.effectiveAvailableBasisPoints <
      V138_BOUNDED_RETRY_POLICY.minimumEffectiveAvailableBasisPoints
    ) {
      state.lastRefusalMilliseconds = atMilliseconds
    }
    return
  }
  if (event.kind === "reserve_route") {
    const next = routes[state.routeReservations.size]
    if (event.identity !== next) {
      if (state.routeReservations.has(event.identity)) {
        fail("V138_RETRY_IDENTITY_ALREADY_CHARGED")
      }
      fail("V138_RETRY_IDENTITY_INVALID")
    }
    if (
      state.preflightReservations.get(event.preflightIdentity) !==
        event.owner ||
      (state.preflightObservations.get(event.preflightIdentity) ?? -1) <
        2_500 ||
      [...state.routePreflights.values()].includes(event.preflightIdentity)
    ) {
      fail("V138_RETRY_ROUTE_ADMISSION_INVALID")
    }
    state.routeReservations.set(event.identity, event.owner)
    state.routePreflights.set(event.identity, event.preflightIdentity)
    return
  }
  if (event.kind === "reserve_calibration") {
    const owner = state.routeReservations.get(event.routeIdentity)
    const routeOrdinal = routes.indexOf(event.routeIdentity)
    const expected = calibrations.slice(routeOrdinal * 8, routeOrdinal * 8 + 8)
    if (
      owner !== event.owner ||
      routeOrdinal < 0 ||
      state.calibrationReservations.has(event.routeIdentity) ||
      canonical(event.identities) !== canonical(expected)
    ) {
      fail("V138_RETRY_CALIBRATION_RESERVATION_INVALID")
    }
    state.calibrationReservations.set(event.routeIdentity, [
      ...event.identities,
    ])
    return
  }
  if (event.kind === "finish_calibration") {
    if (
      state.routeReservations.get(event.routeIdentity) !== event.owner ||
      !state.calibrationReservations.has(event.routeIdentity) ||
      state.calibrationTerminals.has(event.routeIdentity) ||
      (event.supervisionRoot !== undefined && !isSha256(event.supervisionRoot))
    ) {
      fail("V138_RETRY_CALIBRATION_TERMINAL_INVALID")
    }
    if (event.status === "admitted" && !event.completeCleanup) {
      fail("V138_RETRY_CALIBRATION_TERMINAL_INVALID")
    }
    state.calibrationTerminals.set(event.routeIdentity, event)
    if (!event.completeCleanup) state.integrityFailure = true
    if (event.status === "system_failure" && event.completeCleanup) {
      state.lastProcessValidCalibrationFailureMilliseconds = atMilliseconds
    }
    return
  }
  if (event.kind === "reserve_reproduction") {
    const terminal = state.calibrationTerminals.get(event.routeIdentity)
    if (
      state.routeReservations.get(event.routeIdentity) !== event.owner ||
      terminal?.status !== "admitted" ||
      !terminal.completeCleanup ||
      state.reproductionReserved ||
      canonical(event.identities) !== canonical(reproduction)
    ) {
      fail("V138_RETRY_REPRODUCTION_RESERVATION_INVALID")
    }
    state.reproductionReserved = true
    state.reproductionRoute = event.routeIdentity
    return
  }
  if (
    !state.reproductionReserved ||
    state.reproductionRoute !== event.routeIdentity ||
    state.routeReservations.get(event.routeIdentity) !== event.owner ||
    state.reproductionTerminal !== null ||
    !Number.isSafeInteger(event.acceptedCells) ||
    event.acceptedCells < 0 ||
    event.acceptedCells > 540 ||
    (event.reproductionRoot !== undefined &&
      !isSha256(event.reproductionRoot)) ||
    (event.status === "passed_exact" &&
      (event.acceptedCells !== 540 || !event.completeCleanup))
  ) {
    fail("V138_RETRY_REPRODUCTION_TERMINAL_INVALID")
  }
  state.reproductionTerminal = event
}

const replay = (
  records: readonly V138RetryJournalRecord[],
  expectedEnvelopeRoot?: V138RetrySha256,
): ReplayState => {
  if (!Array.isArray(records)) fail("V138_RETRY_JOURNAL_CHAIN_INVALID")
  const state = emptyReplay()
  let previousRoot = GENESIS_ROOT
  let previousTime = -1
  for (let ordinal = 0; ordinal < records.length; ordinal += 1) {
    const record = records[ordinal]!
    const { recordRoot, ...body } = record
    if (
      record.schemaVersion !== "v1.38-bounded-retry-journal-record-v1" ||
      record.ordinal !== ordinal ||
      record.previousRoot !== previousRoot ||
      !isSha256(record.envelopeRoot) ||
      (expectedEnvelopeRoot !== undefined &&
        record.envelopeRoot !== expectedEnvelopeRoot) ||
      (ordinal > 0 && record.envelopeRoot !== records[0]!.envelopeRoot) ||
      record.atMilliseconds < previousTime ||
      !isSha256(recordRoot) ||
      recordRoot !== sha256(`v138-retry-journal-record-v1\0${canonical(body)}`)
    ) {
      fail("V138_RETRY_JOURNAL_CHAIN_INVALID")
    }
    try {
      const {
        schemaVersion: _schema,
        ordinal: _ordinal,
        atMilliseconds,
        previousRoot: _previous,
        recordRoot: _root,
        ...event
      } = record
      applyEvent(state, event as V138RetryJournalEvent, atMilliseconds)
    } catch {
      fail("V138_RETRY_JOURNAL_CHAIN_INVALID")
    }
    previousRoot = recordRoot
    previousTime = record.atMilliseconds
  }
  return state
}

export const appendV138RetryJournalRecord = (
  records: readonly V138RetryJournalRecord[],
  event: V138RetryJournalEvent,
  atMilliseconds: number,
  envelopeRoot: V138RetrySha256,
): readonly V138RetryJournalRecord[] => {
  if (!isSha256(envelopeRoot)) fail("V138_RETRY_ENVELOPE_INVALID")
  const state = replay(records, envelopeRoot)
  applyEvent(state, event, atMilliseconds)
  const body = {
    schemaVersion: "v1.38-bounded-retry-journal-record-v1" as const,
    ordinal: records.length,
    atMilliseconds,
    envelopeRoot,
    previousRoot: records.at(-1)?.recordRoot ?? GENESIS_ROOT,
    ...event,
  }
  const record = deepFreeze({
    ...body,
    recordRoot: sha256(`v138-retry-journal-record-v1\0${canonical(body)}`),
  }) as V138RetryJournalRecord
  return Object.freeze([...records, record])
}

export interface V138DerivedRetryState {
  readonly schemaVersion: "v1.38-bounded-retry-derived-state-v1"
  readonly journalRoot: V138RetrySha256
  readonly preflightObservationsConsumed: number
  readonly routeStartsConsumed: number
  readonly calibrationIdentitiesCharged: number
  readonly reproductionIdentitiesCharged: number
  readonly acceptedCells: number
  readonly remainingPreflightObservations: number
  readonly remainingRouteStarts: number
  readonly nextPreflightIdentity: V138RetryPreflightIdentity | null
  readonly nextRouteIdentity: V138RetryRouteIdentity | null
  readonly protectedHistoricalIdentityCount: number
  readonly firstObservationMilliseconds: number | null
  readonly terminalReason: "time_window_expired" | null
  readonly completeCleanup: boolean
  readonly disposition:
    | "active"
    | "succeeded"
    | "terminal_failure"
    | "exhausted"
  readonly downstreamAuthority: false
  readonly stateRoot: V138RetrySha256
}

export const deriveV138RetryState = (
  envelopeValue: unknown,
  records: readonly V138RetryJournalRecord[],
): Readonly<V138DerivedRetryState> => {
  const envelope = checkV138InactiveRetryEnvelope(envelopeValue)
  const state = replay(records, envelope.envelopeRoot)
  const disposition = terminalDisposition(state)
  const terminal = disposition !== "active"
  const body = {
    schemaVersion: "v1.38-bounded-retry-derived-state-v1" as const,
    journalRoot: records.at(-1)?.recordRoot ?? GENESIS_ROOT,
    preflightObservationsConsumed: state.preflightReservations.size,
    routeStartsConsumed: state.routeReservations.size,
    calibrationIdentitiesCharged: [
      ...state.calibrationReservations.values(),
    ].reduce((count, identities) => count + identities.length, 0),
    reproductionIdentitiesCharged: state.reproductionReserved ? 540 : 0,
    acceptedCells: disposition === "succeeded" ? 540 : 0,
    remainingPreflightObservations: terminal
      ? 0
      : 12 - state.preflightReservations.size,
    remainingRouteStarts: terminal ? 0 : 3 - state.routeReservations.size,
    nextPreflightIdentity: terminal
      ? null
      : (preflights[state.preflightReservations.size] ?? null),
    nextRouteIdentity: terminal
      ? null
      : (routes[state.routeReservations.size] ?? null),
    protectedHistoricalIdentityCount:
      envelope.protectedHistoricalIdentities.length,
    firstObservationMilliseconds: state.firstObservationMilliseconds,
    terminalReason: state.timeWindowExpiryTerminal?.reason ?? null,
    disposition,
    downstreamAuthority: false as const,
  }
  const completeCleanup =
    [...state.calibrationTerminals.values()].every(
      (terminal) => terminal.completeCleanup,
    ) && state.reproductionTerminal?.completeCleanup !== false
  return deepFreeze({
    ...body,
    completeCleanup,
    stateRoot: sha256(`v138-retry-derived-state-v1\0${canonical(body)}`),
  })
}

export const encodeV138RetryCanonicalJson = (value: unknown): string =>
  canonical(value)
