import { createHash } from "node:crypto"
import { constants, lstatSync, openSync, closeSync } from "node:fs"
import path from "node:path"

export type V138RetrySha256 = `sha256:${string}`
export type V138RetryV4RouteIdentity = `route:v4:${0 | 1 | 2}`
export type V138RetryV4PreflightIdentity = `preflight:v4:${number}`
export type V138RetryV4CalibrationIdentity =
  `calibration:v4:${0 | 1 | 2}:${number}`
export type V138RetryV4ReproductionIdentity = `reproduction:v4:${number}`

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

export const V138_BOUNDED_RETRY_V4_POLICY = deepFreeze({
  schemaVersion: "retry-envelope:v4" as const,
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
  (_, ordinal) => `route:v4:${ordinal}` as V138RetryV4RouteIdentity,
)
const preflights = Array.from(
  { length: 12 },
  (_, ordinal) => `preflight:v4:${ordinal}` as V138RetryV4PreflightIdentity,
)
const calibrations = routes.flatMap((_, routeOrdinal) =>
  Array.from(
    { length: 8 },
    (_, attemptOrdinal) =>
      `calibration:v4:${routeOrdinal}:${attemptOrdinal}` as V138RetryV4CalibrationIdentity,
  ),
)
const reproduction = Array.from(
  { length: 540 },
  (_, ordinal) => `reproduction:v4:${ordinal}` as V138RetryV4ReproductionIdentity,
)

export const V138_BOUNDED_RETRY_V4_IDENTITIES = deepFreeze({
  routes,
  preflights,
  calibrations,
  reproduction,
})

const exactHistoricalIdentities = [
  ...Array.from({ length: 5 }, (_, index) => `route:v${index + 3}`),
  ...Array.from({ length: 5 }, (_, index) => `preflight:v${index + 5}:0`),
  ...Array.from({ length: 5 }, (_, route) =>
    Array.from(
      { length: 8 },
      (_, attempt) => `calibration:v${route + 5}:${attempt}`,
    ),
  ).flat(),
  "route:v8:pre_start_obstruction",
  "retry-envelope:v1",
  ...Array.from({ length: 3 }, (_, route) => `route:v1:${route}`),
  ...Array.from({ length: 3 }, (_, observation) => `preflight:v1:${observation}`),
  ...Array.from({ length: 3 }, (_, route) =>
    Array.from(
      { length: 8 },
      (_, attempt) => `calibration:v1:${route}:${attempt}`,
    ),
  ).flat(),
  "retry-envelope:v2",
  ...Array.from({ length: 3 }, (_, route) => `route:v2:${route}`),
  ...Array.from({ length: 12 }, (_, observation) =>
    `preflight:v2:${observation}`,
  ),
  ...Array.from({ length: 3 }, (_, route) =>
    Array.from(
      { length: 8 },
      (_, attempt) => `calibration:v2:${route}:${attempt}`,
    ),
  ).flat(),
  ...Array.from({ length: 540 }, (_, cell) => `reproduction:v2:${cell}`),
]

const protectedHistoryBody = {
  schemaVersion: "v1.38-bounded-retry-protected-history-v3" as const,
  preResearchBaselineCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0" as const,
  researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15" as const,
  correctionV10Root:
    "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3" as V138RetrySha256,
  dispositionV2Root:
    "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f" as V138RetrySha256,
  lifecycleV2Root:
    "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6" as V138RetrySha256,
  authorizationScope: "one_fresh_envelope_v3_source_then_independent_review" as const,
  predecessorEmpiricalOutcome: Object.freeze({
    freshAccepted: 0 as const,
    requiredAccepted: 540 as const,
    terminalDisposition: "exhausted" as const,
    outcomeReinterpreted: false as const,
  }),
  blockedSourceReview: Object.freeze({
    status: "blocked" as const,
    reviewedSourceCommit: "32f53bb743db799810dff820b8b7eb309b6a6629" as const,
    findingRoot:
      "sha256:99ceec74a141e228b2e027c6f0b5d85ddfed8d917ad74e7a493e6d8257f8701a" as V138RetrySha256,
    reviewRoot:
      "sha256:08938c5eb520b041e2b74ac07b7906d14e52197e3788ec97ff6f29350bbdf80d" as V138RetrySha256,
    historicalResultReinterpreted: false as const,
    currentSourceReviewEligible: false as const,
  }),
  protectedFiles: Object.freeze([
    [
      ".planning/artifacts/v1.38-phase-262-review-fix-correction-v10.json",
      "sha256:a5bfe2a99194dc656c86fa05d84d66c87dfc2935875976ad27fe60754f20148d",
    ],
    [
      ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v2.json",
      "sha256:160e4e270cf96a979cd9a83cf97c57f2590076c0abe0bdb712830045d7cab47e",
    ],
    [
      ".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json",
      "sha256:5a2543b4ee3b8786188fa9a35977ee7dd163c175ceda4406ec74f8494da35dcf",
    ],
    [
      ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
      "sha256:ac7f8eb0b0193b469b31c28c33838bb46f36d6061d6e8577f05ccf71f9283546",
    ],
    [
      ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
      "sha256:88a99098d3484c8a78526b27f49ad2c2db3f8d36c6e21256482a8f703bb075ea",
    ],
    [
      ".planning/artifacts/v1.38-successor-source-seal-v12.json",
      "sha256:c9b3c23f87f68249c34ffc76eda06a5785c180f6d65a21ff68bd90fba3087052",
    ],
    [
      ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
      "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452",
    ],
    [
      ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json",
      "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6",
    ],
    [
      "scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts",
      "sha256:158528d7d9ce785a4fb88d72371077a05d7bf2814a0488b8ff8b66a066b4c183",
    ],
    [
      "scripts/lib/v1-38-secure-workspace-path-v6.ts",
      "sha256:f8a2959c2db6a9a80147f6d1ece13d30d9fec457d90354e711be0a49319e5f49",
    ],
    [
      "scripts/lib/v1-38-private-native-bootstrap-v2.ts",
      "sha256:165bdefcc02fd9448b3f5d778888617f90d16e7e0801bc091726574ecfcfae78",
    ],
    [
      "scripts/native/v1-38-successor-transaction-helper-v6.c",
      "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a",
    ],
    [
      "scripts/native/v1-38-secure-manifest-reader-v6.c",
      "sha256:fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1",
    ],
    [
      ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json",
      "sha256:c4dbbfa56bf903b2cb302c7a86acb87359da3f2ac696dbc2ca783376604a5232",
      "eff3f1fea4719131f7ced617df7b0a1d4c89d4d2",
    ],
    [
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-91-REVIEW.md",
      "sha256:fb82e3be073f896a1514ddfc4d16fc84a478342f8375ab6002e7598d72275272",
      "73596b860c06c6a477960fe8936053b1006e1edd",
    ],
    [
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-91-SUMMARY.md",
      "sha256:1db0d52a482f3ce954c03da3b59d22549ca6a913290b2d03ce87c80cb045cbf0",
      "2070f4dd0444c28623c4fbc0270b70a654ea92a1",
    ],
    [
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-90-SUMMARY.md",
      "sha256:4daded12537692e2e180ee9ccd34b8de54b425398d9a68b9923fcfa8b27988b7",
      "ff882bbadc057c0e0786d9251fb942095155db72",
    ],
  ] as const),
  sourceBase: {
    commit: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
    tree: "98e633df3870c944adaa9c5dc553a6df367da354",
  },
  authorization: {
    commit: "453a33a10c247fb9c75e969ed4ab63646b16b488",
    tree: "32626e7f24b7262e461cb1e12c3efb691dbb5739",
    soleParent: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
  },
  correction: {
    root: "sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026" as V138RetrySha256,
    sha256:
      "sha256:94597b4c65d31ea5322cb90262d8e180406f8bfcd1d7f46d3c260f71ccfa2bec" as V138RetrySha256,
    status: "integrity_non_pass" as const,
    integrityPassed: false as const,
    historicalBytesMutated: false as const,
  },
  historical: {
    envelopeRoot:
      "sha256:229c1c3e33ee055448b4b8ac7dc2bb53efd84774416d51d984044b2a7f35f153" as V138RetrySha256,
    envelopeSha256:
      "sha256:3683a02dc8c075d7e175c591967dfc5d470de56bb2c0ffe916fb09c13bb4d9f4" as V138RetrySha256,
    journalSha256:
      "sha256:14e66af5c9fc985ef01cbc83efae35ea2a1ae20f1c9b10de0cd2e732dd667a14" as V138RetrySha256,
    terminalSha256:
      "sha256:b79dc330212880f8e6b9d41bee701b380fbc92f2e82682159343e54ae8748ac3" as V138RetrySha256,
    receiptManifestRoot:
      "sha256:cbafd7aaedef7b8f8c9d596a79c914482df40300fc0142e912db2754fe39a4b7" as V138RetrySha256,
    receiptManifestSha256:
      "sha256:611e0e8b12e06593b56b5625d37bf9a8113920bace6b590c2a59c7bfafaa1c16" as V138RetrySha256,
    privateReceiptCount: 15 as const,
    sealRoot:
      "sha256:d5dc18c14d004f3bff8459974229b9af49b2e2a83732ead116cf84450fb46e63" as V138RetrySha256,
    sealSha256:
      "sha256:0091b634e49a94863f6cbb12b9e06f181b729eb32dc9e97ba73dda0bb6359e6b" as V138RetrySha256,
    dispositionRoot:
      "sha256:5fe2dbf967971c6d69d619e91e8d838f5e6495ded3cc23889cf98f0b42dcccdf" as V138RetrySha256,
    dispositionSha256:
      "sha256:7c44d03acee04f441e0c4132f6c611b9d84925540a81d954ba51104aaec938bb" as V138RetrySha256,
    lifecycleRoot:
      "sha256:3b13e8656208643f4ce339bdab2f29bf56e38b00938afd49cfbc88164595a8b0" as V138RetrySha256,
    lifecycleSha256:
      "sha256:c0bdb131ce6804f9708899079049ee4583916646deebec5bcc757f68c1410b5e" as V138RetrySha256,
    routeStartsCharged: 3 as const,
    preflightObservationsCharged: 3 as const,
    calibrationIdentitiesCharged: 24 as const,
    reproductionIdentitiesCharged: 0 as const,
    freshAccepted: 0 as const,
  },
  protectedIdentities: exactHistoricalIdentities,
}

export const V138_BOUNDED_RETRY_V4_PROTECTED_HISTORY = deepFreeze({
  ...protectedHistoryBody,
  protectedHistoryRoot: sha256(
    `v138-bounded-retry-protected-history-v3\0${canonical(protectedHistoryBody)}`,
  ),
})

export const checkV138ProtectedHistoryV4 = (
  value: unknown,
): typeof V138_BOUNDED_RETRY_V4_PROTECTED_HISTORY => {
  if (canonical(value) !== canonical(V138_BOUNDED_RETRY_V4_PROTECTED_HISTORY)) {
    return fail("V138_RETRY_V4_PROTECTED_HISTORY_INVALID")
  }
  return value as typeof V138_BOUNDED_RETRY_V4_PROTECTED_HISTORY
}

export const V138_BOUNDED_RETRY_V4_PATHS = deepFreeze({
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v18.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v14.json",
  envelope: ".planning/artifacts/v1.38-plan-262-145-retry-envelope-v4.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl",
  lock: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl.lock",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v4",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v4.json",
  disposition:
    ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
  correction:
    ".planning/artifacts/v1.38-phase-262-review-fix-correction-v12.json",
  activation:
    ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
  readiness:
    ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v4.json",
  lifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v4.json",
})

export const requireV138RetryV4DestinationAbsent = (
  root: string,
  relativeDestination: string,
): true => {
  const resolvedRoot = path.resolve(root)
  const target = path.resolve(resolvedRoot, relativeDestination)
  const relative = path.relative(resolvedRoot, target)
  if (
    relative.length === 0 ||
    relative.startsWith(`..${path.sep}`) ||
    relative === ".." ||
    path.isAbsolute(relative)
  ) {
    return fail("V138_RETRY_V4_DESTINATION_UNSAFE")
  }
  const components = relative.split(path.sep)
  let current = resolvedRoot
  try {
    const rootStatus = lstatSync(current)
    if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) throw new Error()
    for (const component of components.slice(0, -1)) {
      current = path.join(current, component)
      const status = lstatSync(current)
      if (!status.isDirectory() || status.isSymbolicLink()) throw new Error()
    }
    const descriptor = openSync(
      target,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    closeSync(descriptor)
    return fail("V138_RETRY_V4_DESTINATION_UNSAFE")
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ENOENT") {
      try {
        lstatSync(path.dirname(target))
        return true
      } catch {
        return fail("V138_RETRY_V4_DESTINATION_UNSAFE")
      }
    }
    return fail("V138_RETRY_V4_DESTINATION_UNSAFE")
  }
}

export const requireV138RetryV4ReproductionAbsent = (root: string): true => {
  try {
    return requireV138RetryV4DestinationAbsent(
      root,
      V138_BOUNDED_RETRY_V4_PATHS.reproduction,
    )
  } catch {
    return fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }
}

export interface V138InactiveRetryV4Envelope {
  readonly schemaVersion: "retry-envelope:v4"
  readonly status: "sealed_inactive"
  readonly sourceRoot: V138RetrySha256
  readonly reviewRoot: V138RetrySha256
  readonly sealRoot: V138RetrySha256
  readonly protectedHistoryRoot: V138RetrySha256
  readonly protectedHistoricalIdentities: readonly string[]
  readonly policy: typeof V138_BOUNDED_RETRY_V4_POLICY
  readonly counters: Readonly<{
    preflightObservationsConsumed: 0
    routeStartsConsumed: 0
    calibrationIdentitiesCharged: 0
    reproductionIdentitiesCharged: 0
    acceptedCells: 0
  }>
  readonly envelopeRoot: V138RetrySha256
}

export const createV138InactiveRetryV4Envelope = (
  input: Readonly<{
    sourceRoot: V138RetrySha256
    reviewRoot: V138RetrySha256
    sealRoot: V138RetrySha256
    protectedHistoryRoot: V138RetrySha256
    protectedHistoricalIdentities: readonly string[]
  }>,
): Readonly<V138InactiveRetryV4Envelope> => {
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
        routes.includes(identity as V138RetryV4RouteIdentity) ||
        preflights.includes(identity as V138RetryV4PreflightIdentity) ||
        calibrations.includes(identity as V138RetryV4CalibrationIdentity) ||
        reproduction.includes(identity as V138RetryV4ReproductionIdentity),
    )
  ) {
    return fail("V138_RETRY_ENVELOPE_INPUT_INVALID")
  }
  const body = {
    schemaVersion: "retry-envelope:v4" as const,
    status: "sealed_inactive" as const,
    sourceRoot: input.sourceRoot,
    reviewRoot: input.reviewRoot,
    sealRoot: input.sealRoot,
    protectedHistoryRoot: input.protectedHistoryRoot,
    protectedHistoricalIdentities: [...input.protectedHistoricalIdentities],
    policy: V138_BOUNDED_RETRY_V4_POLICY,
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
    envelopeRoot: sha256(`v138-retry-envelope-v4\0${canonical(body)}`),
  })
}

export const checkV138InactiveRetryV4Envelope = (
  value: unknown,
): Readonly<V138InactiveRetryV4Envelope> => {
  const candidate = value as V138InactiveRetryV4Envelope
  try {
    const expected = createV138InactiveRetryV4Envelope({
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
  identity: V138RetryV4PreflightIdentity
  owner: string
}>
type ObservePreflight = Readonly<{
  kind: "observe_preflight"
  identity: V138RetryV4PreflightIdentity
  owner: string
  effectiveAvailableBasisPoints: number
}>
type ReserveRoute = Readonly<{
  kind: "reserve_route"
  identity: V138RetryV4RouteIdentity
  owner: string
  preflightIdentity: V138RetryV4PreflightIdentity
}>
type ReserveCalibration = Readonly<{
  kind: "reserve_calibration"
  routeIdentity: V138RetryV4RouteIdentity
  owner: string
  identities: readonly V138RetryV4CalibrationIdentity[]
}>
type FinishCalibration = Readonly<{
  kind: "finish_calibration"
  routeIdentity: V138RetryV4RouteIdentity
  owner: string
  status: "admitted" | "system_failure"
  completeCleanup: boolean
  supervisionRoot?: V138RetrySha256
}>
type ReserveReproduction = Readonly<{
  kind: "reserve_reproduction"
  routeIdentity: V138RetryV4RouteIdentity
  owner: string
  identities: readonly V138RetryV4ReproductionIdentity[]
}>
type FinishReproduction = Readonly<{
  kind: "finish_reproduction"
  routeIdentity: V138RetryV4RouteIdentity
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

export type V138RetryV4JournalEvent =
  | ReservePreflight
  | ObservePreflight
  | ReserveRoute
  | ReserveCalibration
  | FinishCalibration
  | ReserveReproduction
  | FinishReproduction
  | TimeWindowExpired

export type V138RetryV4JournalRecord = Readonly<
  V138RetryV4JournalEvent & {
    schemaVersion: "v1.38-bounded-retry-journal-record-v4"
    ordinal: number
    atMilliseconds: number
    envelopeRoot: V138RetrySha256
    previousRoot: V138RetrySha256
    recordRoot: V138RetrySha256
  }
>

const GENESIS_ROOT = sha256("v138-bounded-retry-journal-genesis-v4")

type ReplayState = {
  preflightReservations: Map<V138RetryV4PreflightIdentity, string>
  preflightObservations: Map<V138RetryV4PreflightIdentity, number>
  routeReservations: Map<V138RetryV4RouteIdentity, string>
  routePreflights: Map<V138RetryV4RouteIdentity, V138RetryV4PreflightIdentity>
  calibrationReservations: Map<
    V138RetryV4RouteIdentity,
    readonly V138RetryV4CalibrationIdentity[]
  >
  calibrationTerminals: Map<V138RetryV4RouteIdentity, FinishCalibration>
  reproductionRoute: V138RetryV4RouteIdentity | null
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

const assertOwner: (owner: unknown) => asserts owner is string = (owner) => {
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
  event: V138RetryV4JournalEvent,
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
          V138_BOUNDED_RETRY_V4_POLICY.envelopeLifetimeMilliseconds
    ) {
      fail("V138_RETRY_TIME_WINDOW_ACTIVE")
    }
    state.timeWindowExpiryTerminal = event
    return
  }
  const isCleanupUnknownReconciliation =
    (event.kind === "finish_calibration" &&
      event.status === "system_failure" &&
      event.completeCleanup === false &&
      state.calibrationReservations.has(event.routeIdentity) &&
      !state.calibrationTerminals.has(event.routeIdentity)) ||
    (event.kind === "finish_reproduction" &&
      event.status === "system_failure" &&
      event.acceptedCells === 0 &&
      event.completeCleanup === false &&
      state.reproductionReserved &&
      state.reproductionTerminal === null)
  if (
    state.firstObservationMilliseconds !== null &&
    atMilliseconds >=
      state.firstObservationMilliseconds +
        V138_BOUNDED_RETRY_V4_POLICY.envelopeLifetimeMilliseconds &&
    !isCleanupUnknownReconciliation
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
          V138_BOUNDED_RETRY_V4_POLICY.refusalSpacingMilliseconds
    ) {
      fail("V138_RETRY_REFUSAL_SPACING_REQUIRED")
    }
    if (
      state.lastProcessValidCalibrationFailureMilliseconds !== null &&
      atMilliseconds <
        state.lastProcessValidCalibrationFailureMilliseconds +
          V138_BOUNDED_RETRY_V4_POLICY.calibrationFailureBackoffMilliseconds
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
      V138_BOUNDED_RETRY_V4_POLICY.minimumEffectiveAvailableBasisPoints
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
  records: readonly V138RetryV4JournalRecord[],
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
      record.schemaVersion !== "v1.38-bounded-retry-journal-record-v4" ||
      record.ordinal !== ordinal ||
      record.previousRoot !== previousRoot ||
      !isSha256(record.envelopeRoot) ||
      (expectedEnvelopeRoot !== undefined &&
        record.envelopeRoot !== expectedEnvelopeRoot) ||
      (ordinal > 0 && record.envelopeRoot !== records[0]!.envelopeRoot) ||
      record.atMilliseconds < previousTime ||
      !isSha256(recordRoot) ||
      recordRoot !== sha256(`v138-retry-journal-record-v4\0${canonical(body)}`)
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
      applyEvent(state, event as V138RetryV4JournalEvent, atMilliseconds)
    } catch {
      fail("V138_RETRY_JOURNAL_CHAIN_INVALID")
    }
    previousRoot = recordRoot
    previousTime = record.atMilliseconds
  }
  return state
}

export const appendV138RetryV4JournalRecord = (
  records: readonly V138RetryV4JournalRecord[],
  event: V138RetryV4JournalEvent,
  atMilliseconds: number,
  envelopeRoot: V138RetrySha256,
): readonly V138RetryV4JournalRecord[] => {
  if (!isSha256(envelopeRoot)) fail("V138_RETRY_ENVELOPE_INVALID")
  const state = replay(records, envelopeRoot)
  applyEvent(state, event, atMilliseconds)
  const body = {
    schemaVersion: "v1.38-bounded-retry-journal-record-v4" as const,
    ordinal: records.length,
    atMilliseconds,
    envelopeRoot,
    previousRoot: records.at(-1)?.recordRoot ?? GENESIS_ROOT,
    ...event,
  }
  const record = deepFreeze({
    ...body,
    recordRoot: sha256(`v138-retry-journal-record-v4\0${canonical(body)}`),
  }) as V138RetryV4JournalRecord
  return Object.freeze([...records, record])
}

export interface V138DerivedRetryV4State {
  readonly schemaVersion: "v1.38-bounded-retry-derived-state-v4"
  readonly journalRoot: V138RetrySha256
  readonly preflightObservationsConsumed: number
  readonly routeStartsConsumed: number
  readonly calibrationIdentitiesCharged: number
  readonly reproductionIdentitiesCharged: number
  readonly acceptedCells: number
  readonly remainingPreflightObservations: number
  readonly remainingRouteStarts: number
  readonly nextPreflightIdentity: V138RetryV4PreflightIdentity | null
  readonly nextRouteIdentity: V138RetryV4RouteIdentity | null
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

export const deriveV138RetryV4State = (
  envelopeValue: unknown,
  records: readonly V138RetryV4JournalRecord[],
): Readonly<V138DerivedRetryV4State> => {
  const envelope = checkV138InactiveRetryV4Envelope(envelopeValue)
  const state = replay(records, envelope.envelopeRoot)
  const disposition = terminalDisposition(state)
  const terminal = disposition !== "active"
  const completeCleanup =
    state.calibrationReservations.size === state.calibrationTerminals.size &&
    [...state.calibrationTerminals.values()].every(
      (terminal) => terminal.completeCleanup,
    ) &&
    (!state.reproductionReserved ||
      state.reproductionTerminal?.completeCleanup === true)
  const body = {
    schemaVersion: "v1.38-bounded-retry-derived-state-v4" as const,
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
    completeCleanup,
    disposition,
    downstreamAuthority: false as const,
  }
  return deepFreeze({
    ...body,
    stateRoot: sha256(`v138-retry-derived-state-v4\0${canonical(body)}`),
  })
}

export const encodeV138RetryV4CanonicalJson = (value: unknown): string =>
  canonical(value)
