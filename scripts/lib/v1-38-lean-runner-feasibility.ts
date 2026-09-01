import { createHash } from "node:crypto"
import {
  BOTTOM_STARTING_POSITIONS,
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  DEFAULT_RUNTIME_LIMITS,
  TOP_STARTING_POSITIONS,
  encodeCanonicalJson,
  type RuntimeExecutionServiceResponseV118,
} from "@cowards/spec"
import { findAdvancedStrategy } from "../../packages/persistence/src/advanced-strategies.js"
import { findStarterStrategy } from "../../packages/persistence/src/starter-strategies.js"

export const LEAN_SCHEMA = "v1.38-lean-runner-feasibility-v1" as const
export const LEAN_MANIFEST_SCHEMA = "v1.38-lean-runner-manifest-v1" as const
export const LEAN_CLAIM = "fixture_feasibility_only" as const
export const LEAN_DEADLINE_MS = 15 * 60 * 1_000
export const LEAN_PASSES = ["pass:a", "pass:b"] as const
export const LEAN_FIXTURES = {
  starter: "starter:aggro-chaser",
  advanced: "advanced:vanguard-pressure",
} as const
export const LEAN_AUTHORITY_FALSE = Object.freeze({
  archiveAuthorized: false,
  candidateSearchAuthorized: false,
  countedPlayAuthorized: false,
  formationMaterializationAuthorized: false,
  foundationActivationAuthorized: false,
  gameplayChangeAuthorized: false,
  holdoutOpeningAuthorized: false,
  phase263ExecutionAuthorized: false,
  phase263PlanningAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  publicAuthorized: false,
  tagAuthorized: false,
})

export type LeanAuthority = typeof LEAN_AUTHORITY_FALSE
export type LeanPass = (typeof LEAN_PASSES)[number]
export type LeanExecutionClassification =
  | "success"
  | "player_violation"
  | "system_failure"
  | "timeout"
  | "cancelled"
  | "unlaunched"

export interface LeanCell {
  readonly cellId: string
  readonly baseCellId: string
  readonly chargedIdentity: string
  readonly ordinal: number
  readonly pass: LeanPass
  readonly arenaId: string
  readonly arenaLabel: string
  readonly semanticGeometryHash: `sha256:${string}`
  readonly bottomFixtureId: string
  readonly topFixtureId: string
  readonly initiativeSide: "bottom" | "top"
}

export interface LeanExecutionRecord extends LeanCell {
  readonly classification: LeanExecutionClassification
  readonly cleanupComplete: boolean
  readonly orphanedChild: boolean
  readonly boardRealism: boolean
  readonly integrityValid: boolean
  readonly requestRealismRoot?: `sha256:${string}`
  readonly currentFormationRoot?: `sha256:${string}`
  readonly outcomeRoot?: `sha256:${string}`
  readonly finalStateRoot?: `sha256:${string}`
  readonly transitionEventRoot?: `sha256:${string}`
  readonly runtimeAccountingRoot?: `sha256:${string}`
}

export interface LeanTerminal {
  readonly schemaVersion: typeof LEAN_SCHEMA
  readonly claimClass: typeof LEAN_CLAIM
  readonly historicalFullMatrix: {
    readonly disposition: "exhausted"
    readonly freshAccepted: 0
    readonly requiredAccepted: 540
    readonly reinterpreted: false
  }
  readonly schedule: {
    readonly uniqueCells: 12
    readonly passes: 2
    readonly chargedExecutions: 24
  }
  readonly result: "pass" | "non_pass" | "invalid"
  readonly counts: {
    readonly success: number
    readonly playerViolation: number
    readonly systemFailure: number
    readonly timeout: number
    readonly cancelled: number
    readonly unlaunched: number
  }
  readonly determinism: { readonly comparedCells: number; readonly mismatchCount: number }
  readonly completeCleanup: boolean
  readonly evidence: readonly LeanExecutionRecord[]
  readonly formationMaterialized: false
  readonly authority: LeanAuthority
}

export interface LeanManifest {
  readonly schemaVersion: typeof LEAN_MANIFEST_SCHEMA
  readonly claimClass: typeof LEAN_CLAIM
  readonly source: {
    readonly commit: string
    readonly tree: string
    readonly executableBlobs: Readonly<Record<string, string>>
  }
  readonly selectedTuple: Readonly<Record<string, unknown>>
  readonly fixtures: {
    readonly starter: { readonly id: string; readonly version: string; readonly sourceHash: string }
    readonly advanced: { readonly id: string; readonly version: string; readonly sourceHash: string }
  }
  readonly arenas: readonly {
    readonly id: string
    readonly label: string
    readonly semanticGeometryHash: string
  }[]
  readonly formation: {
    readonly profile: "current_edge_rank"
    readonly root: `sha256:${string}`
  }
  readonly scheduleRoot: `sha256:${string}`
  readonly runtimeLimitsRoot: `sha256:${string}`
  readonly normalization: readonly [
    "terminalOutcome",
    "finalState",
    "orderedTransitionsAndEvents",
    "runtimeAccounting",
  ]
  readonly deadlineMilliseconds: 900000
  readonly historicalFullMatrix: LeanTerminal["historicalFullMatrix"]
  readonly formationMaterialized: false
  readonly authority: LeanAuthority
}

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalHash = (value: unknown): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value as never, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError(`LEAN_CANONICAL_${encoded.error.code}`)
  return sha256(encoded.bytes)
}

export const LEAN_CURRENT_FORMATION_ROOT = canonicalHash({
  bottom: BOTTOM_STARTING_POSITIONS,
  top: TOP_STARTING_POSITIONS,
})

/**
 * Privacy-safe commitment reconstructed from the scheduled public identities.
 * The live adapter emits this root only after checking its actual prepared
 * request against the same fields and the canonical current initial state.
 */
export const leanRequestRealismRoot = (cell: LeanCell): `sha256:${string}` => canonicalHash({
  arena: {
    id: cell.arenaId,
    label: cell.arenaLabel,
    semanticGeometryHash: cell.semanticGeometryHash,
  },
  fixtures: { bottom: cell.bottomFixtureId, top: cell.topFixtureId },
  initiativeSide: cell.initiativeSide,
  formationRoot: LEAN_CURRENT_FORMATION_ROOT,
  runtimeLimitsRoot: canonicalHash(DEFAULT_RUNTIME_LIMITS),
  runtimeAbi: "strategy-runtime-abi-v1.19",
})

const sidePairs = [
  [LEAN_FIXTURES.starter, LEAN_FIXTURES.advanced],
  [LEAN_FIXTURES.advanced, LEAN_FIXTURES.starter],
] as const

export const buildLeanSchedule = (): readonly LeanCell[] => {
  const base: Omit<LeanCell, "cellId" | "chargedIdentity" | "ordinal" | "pass">[] = []
  for (const arena of CANONICAL_ARENA_CATALOG_V1_37.arenas) {
    for (const [bottomFixtureId, topFixtureId] of sidePairs) {
      for (const initiativeSide of ["bottom", "top"] as const) {
        const baseCellId = [
          "lean",
          arena.id,
          `bottom=${bottomFixtureId}`,
          `top=${topFixtureId}`,
          `initiative=${initiativeSide}`,
        ].join(":")
        base.push({
          baseCellId,
          arenaId: arena.id,
          arenaLabel: arena.name,
          semanticGeometryHash: arena.semanticGeometryHash,
          bottomFixtureId,
          topFixtureId,
          initiativeSide,
        })
      }
    }
  }
  const schedule = LEAN_PASSES.flatMap((pass) =>
    base.map((cell) => ({
      ...cell,
      pass,
      ordinal: 0,
      cellId: `${cell.baseCellId}:${pass}`,
      chargedIdentity: `lean-charge:${pass}:${cell.baseCellId}`,
    })),
  ).map((cell, ordinal) => Object.freeze({ ...cell, ordinal }))
  if (base.length !== 12 || schedule.length !== 24) {
    throw new TypeError("LEAN_SCHEDULE_CARDINALITY")
  }
  return Object.freeze(schedule)
}

const expectedById = new Map(buildLeanSchedule().map((cell) => [cell.cellId, cell]))
const rootsEqual = (left: LeanExecutionRecord, right: LeanExecutionRecord): boolean =>
  left.outcomeRoot !== undefined &&
  left.outcomeRoot === right.outcomeRoot &&
  left.finalStateRoot !== undefined &&
  left.finalStateRoot === right.finalStateRoot &&
  left.transitionEventRoot !== undefined &&
  left.transitionEventRoot === right.transitionEventRoot &&
  left.runtimeAccountingRoot !== undefined &&
  left.runtimeAccountingRoot === right.runtimeAccountingRoot

export const reduceLeanExecutions = (
  records: readonly LeanExecutionRecord[],
  forceInvalid = false,
): LeanTerminal => {
  const counts = {
    success: 0,
    playerViolation: 0,
    systemFailure: 0,
    timeout: 0,
    cancelled: 0,
    unlaunched: 0,
  }
  const seen = new Map<string, LeanExecutionRecord>()
  let invalid = forceInvalid || records.length !== 24
  for (const [recordIndex, record] of records.entries()) {
    const expected = expectedById.get(record.cellId)
    const semanticRoots = [record.outcomeRoot, record.finalStateRoot, record.transitionEventRoot, record.runtimeAccountingRoot]
    const launchedWithSemanticEvidence = record.classification === "success" || record.classification === "player_violation"
    if (
      expected === undefined ||
      seen.has(record.cellId) ||
      expected.ordinal !== recordIndex ||
      record.integrityValid !== true ||
      (launchedWithSemanticEvidence &&
        (!semanticRoots.every(isSha) ||
          record.requestRealismRoot !== leanRequestRealismRoot(record) ||
          record.currentFormationRoot !== LEAN_CURRENT_FORMATION_ROOT ||
          record.boardRealism !== true)) ||
      (!launchedWithSemanticEvidence &&
        (semanticRoots.some((root) => root !== undefined) ||
          record.requestRealismRoot !== undefined ||
          record.currentFormationRoot !== undefined)) ||
      JSON.stringify(expected) !== JSON.stringify(
        Object.fromEntries(Object.keys(expected).map((key) => [key, record[key as keyof LeanCell]])),
      )
    ) invalid = true
    seen.set(record.cellId, record)
    const key = record.classification === "player_violation"
      ? "playerViolation"
      : record.classification === "system_failure"
        ? "systemFailure"
        : record.classification
    counts[key] += 1
  }
  let comparedCells = 0
  let mismatchCount = 0
  for (const base of buildLeanSchedule().slice(0, 12)) {
    const a = seen.get(`${base.baseCellId}:pass:a`)
    const b = seen.get(`${base.baseCellId}:pass:b`)
    if (a && b) {
      comparedCells += 1
      if (!rootsEqual(a, b)) mismatchCount += 1
    }
  }
  const completeCleanup = records.length === 24 && records.every(
    ({ cleanupComplete, orphanedChild }) => cleanupComplete && !orphanedChild,
  )
  if (!completeCleanup) invalid = true
  const passes = !invalid && counts.success === 24 && completeCleanup &&
    records.every(({ boardRealism }) => boardRealism) &&
    comparedCells === 12 && mismatchCount === 0
  return Object.freeze({
    schemaVersion: LEAN_SCHEMA,
    claimClass: LEAN_CLAIM,
    historicalFullMatrix: Object.freeze({
      disposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reinterpreted: false,
    }),
    schedule: Object.freeze({ uniqueCells: 12, passes: 2, chargedExecutions: 24 }),
    result: invalid ? "invalid" : passes ? "pass" : "non_pass",
    counts: Object.freeze(counts),
    determinism: Object.freeze({ comparedCells, mismatchCount }),
    completeCleanup,
    evidence: Object.freeze(records.map((record) => Object.freeze(globalThis.structuredClone(record)))),
    formationMaterialized: false,
    authority: LEAN_AUTHORITY_FALSE,
  })
}

const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const isSha = (value: unknown): value is `sha256:${string}` =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const isOid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)

const validateLeanExecutionEvidence = (value: unknown): LeanExecutionRecord => {
  const cellKeys = ["cellId", "baseCellId", "chargedIdentity", "ordinal", "pass", "arenaId", "arenaLabel", "semanticGeometryHash", "bottomFixtureId", "topFixtureId", "initiativeSide"]
  const commonKeys = [...cellKeys, "classification", "cleanupComplete", "orphanedChild", "boardRealism", "integrityValid"]
  if (!exactKeys(value, commonKeys) && !exactKeys(value, [...commonKeys, "requestRealismRoot", "currentFormationRoot", "outcomeRoot", "finalStateRoot", "transitionEventRoot", "runtimeAccountingRoot"])) throw new TypeError("LEAN_EVIDENCE_KEYS")
  const candidate = value as unknown as LeanExecutionRecord
  const expected = expectedById.get(candidate.cellId)
  if (
    expected === undefined ||
    JSON.stringify(expected) !== JSON.stringify(Object.fromEntries(Object.keys(expected).map((key) => [key, candidate[key as keyof LeanCell]]))) ||
    !["success", "player_violation", "system_failure", "timeout", "cancelled", "unlaunched"].includes(candidate.classification) ||
    typeof candidate.cleanupComplete !== "boolean" ||
    typeof candidate.orphanedChild !== "boolean" ||
    typeof candidate.boardRealism !== "boolean" ||
    typeof candidate.integrityValid !== "boolean"
  ) throw new TypeError("LEAN_EVIDENCE_INVALID")
  const semantic = candidate.classification === "success" || candidate.classification === "player_violation"
  if (semantic) {
    if (
      ![candidate.outcomeRoot, candidate.finalStateRoot, candidate.transitionEventRoot, candidate.runtimeAccountingRoot, candidate.requestRealismRoot, candidate.currentFormationRoot].every(isSha) ||
      candidate.requestRealismRoot !== leanRequestRealismRoot(candidate) ||
      candidate.currentFormationRoot !== LEAN_CURRENT_FORMATION_ROOT
    ) throw new TypeError("LEAN_EVIDENCE_REALISM_INVALID")
  } else if ([candidate.outcomeRoot, candidate.finalStateRoot, candidate.transitionEventRoot, candidate.runtimeAccountingRoot, candidate.requestRealismRoot, candidate.currentFormationRoot].some((root) => root !== undefined)) {
    throw new TypeError("LEAN_EVIDENCE_CLASSIFICATION_ROOTS")
  }
  return globalThis.structuredClone(candidate)
}

export const deriveAndValidateLeanTerminal = (value: unknown): LeanTerminal => {
  const keys = ["schemaVersion", "claimClass", "historicalFullMatrix", "schedule", "result", "counts", "determinism", "completeCleanup", "evidence", "formationMaterialized", "authority"]
  if (!exactKeys(value, keys) || !Array.isArray(value.evidence)) throw new TypeError("LEAN_TERMINAL_KEYS")
  const evidence = value.evidence.map(validateLeanExecutionEvidence)
  if (evidence.length !== buildLeanSchedule().length || evidence.some((record, ordinal) => record.ordinal !== ordinal)) throw new TypeError("LEAN_EVIDENCE_ORDER")
  const derived = reduceLeanExecutions(evidence)
  if (canonicalHash(derived) !== canonicalHash(value)) throw new TypeError("LEAN_TERMINAL_DERIVATION_MISMATCH")
  return derived
}

export const createLeanManifest = (source: LeanManifest["source"]): LeanManifest => {
  const starter = findStarterStrategy(LEAN_FIXTURES.starter)
  const advanced = findAdvancedStrategy(LEAN_FIXTURES.advanced)
  const selected = CANONICAL_COMPATIBILITY_TUPLES.find(
    ({ tuple }) => tuple.runtimeAbi === "strategy-runtime-abi-v1.19",
  )
  if (!starter || !advanced || !selected) throw new TypeError("LEAN_SELECTED_INPUT_MISSING")
  return validateLeanManifest({
    schemaVersion: LEAN_MANIFEST_SCHEMA,
    claimClass: LEAN_CLAIM,
    source,
    selectedTuple: { tupleId: selected.tupleId, ...selected.tuple },
    fixtures: {
      starter: { id: starter.id, version: starter.version, sourceHash: `sha256:${starter.sourceHash}` },
      advanced: { id: advanced.id, version: advanced.version, sourceHash: `sha256:${advanced.sourceHash}` },
    },
    arenas: CANONICAL_ARENA_CATALOG_V1_37.arenas.map((arena) => ({
      id: arena.id, label: arena.name, semanticGeometryHash: arena.semanticGeometryHash,
    })),
    formation: {
      profile: "current_edge_rank",
      root: LEAN_CURRENT_FORMATION_ROOT,
    },
    scheduleRoot: canonicalHash(buildLeanSchedule()),
    runtimeLimitsRoot: canonicalHash(DEFAULT_RUNTIME_LIMITS),
    normalization: ["terminalOutcome", "finalState", "orderedTransitionsAndEvents", "runtimeAccounting"],
    deadlineMilliseconds: LEAN_DEADLINE_MS,
    historicalFullMatrix: { disposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reinterpreted: false },
    formationMaterialized: false,
    authority: LEAN_AUTHORITY_FALSE,
  })
}

export const validateLeanManifest = (value: unknown): LeanManifest => {
  const assert = (condition: boolean, code: string): void => {
    if (!condition) throw new TypeError(code)
  }
  const topKeys = ["schemaVersion", "claimClass", "source", "selectedTuple", "fixtures", "arenas", "formation", "scheduleRoot", "runtimeLimitsRoot", "normalization", "deadlineMilliseconds", "historicalFullMatrix", "formationMaterialized", "authority"]
  assert(exactKeys(value, topKeys), "LEAN_MANIFEST_KEYS")
  const source = value.source
  const fixtures = value.fixtures
  const formation = value.formation
  const history = value.historicalFullMatrix
  const authority = value.authority
  assert(value.schemaVersion === LEAN_MANIFEST_SCHEMA && value.claimClass === LEAN_CLAIM, "LEAN_MANIFEST_IDENTITY")
  assert(value.deadlineMilliseconds === LEAN_DEADLINE_MS && value.formationMaterialized === false, "LEAN_MANIFEST_BOUNDS")
  assert(isSha(value.scheduleRoot) && isSha(value.runtimeLimitsRoot), "LEAN_MANIFEST_ROOTS")
  assert(exactKeys(source, ["commit", "tree", "executableBlobs"]) && isOid(source.commit) && isOid(source.tree), "LEAN_MANIFEST_SOURCE")
  assert(source.executableBlobs !== null && typeof source.executableBlobs === "object" && !Array.isArray(source.executableBlobs) && Object.values(source.executableBlobs).every(isOid), "LEAN_MANIFEST_BLOBS")
  assert(exactKeys(fixtures, ["starter", "advanced"]), "LEAN_MANIFEST_FIXTURES")
  assert(exactKeys(fixtures.starter, ["id", "version", "sourceHash"]) && fixtures.starter.id === LEAN_FIXTURES.starter && typeof fixtures.starter.version === "string" && isSha(fixtures.starter.sourceHash), "LEAN_MANIFEST_STARTER")
  assert(exactKeys(fixtures.advanced, ["id", "version", "sourceHash"]) && fixtures.advanced.id === LEAN_FIXTURES.advanced && typeof fixtures.advanced.version === "string" && isSha(fixtures.advanced.sourceHash), "LEAN_MANIFEST_ADVANCED")
  assert(Array.isArray(value.arenas) && value.arenas.length === 3 && value.arenas.every((arena) => exactKeys(arena, ["id", "label", "semanticGeometryHash"]) && typeof arena.id === "string" && typeof arena.label === "string" && isSha(arena.semanticGeometryHash)), "LEAN_MANIFEST_ARENAS")
  assert(exactKeys(formation, ["profile", "root"]) && formation.profile === "current_edge_rank" && isSha(formation.root), "LEAN_MANIFEST_FORMATION")
  assert(Array.isArray(value.normalization) && JSON.stringify(value.normalization) === JSON.stringify(["terminalOutcome", "finalState", "orderedTransitionsAndEvents", "runtimeAccounting"]), "LEAN_MANIFEST_NORMALIZATION")
  assert(exactKeys(history, ["disposition", "freshAccepted", "requiredAccepted", "reinterpreted"]) && history.disposition === "exhausted" && history.freshAccepted === 0 && history.requiredAccepted === 540 && history.reinterpreted === false, "LEAN_MANIFEST_HISTORY")
  assert(exactKeys(authority, Object.keys(LEAN_AUTHORITY_FALSE)) && Object.values(authority).every((flag) => flag === false), "LEAN_MANIFEST_AUTHORITY")
  assert(value.selectedTuple !== null && typeof value.selectedTuple === "object" && !Array.isArray(value.selectedTuple), "LEAN_MANIFEST_TUPLE")
  return globalThis.structuredClone(value) as LeanManifest
}

export const hashLeanValue = canonicalHash

/**
 * The lean gate compares the explicit public-receipt anchors issued by the
 * strict v1.18 service. It deliberately does not recursively delete keys or
 * rewrite arbitrary strings: doing so could erase genuine gameplay drift.
 */
export const projectLeanV118Response = (
  response: RuntimeExecutionServiceResponseV118,
): Pick<
  LeanExecutionRecord,
  "classification" | "outcomeRoot" | "finalStateRoot" |
    "transitionEventRoot" | "runtimeAccountingRoot"
> | { readonly classification: "system_failure" } => {
  if (!response.ok) return Object.freeze({ classification: "system_failure" })
  return Object.freeze({
    classification: "success",
    outcomeRoot: response.result.outcomeCanonicalHash,
    finalStateRoot: response.result.finalStateCanonicalHash,
    transitionEventRoot: canonicalHash({
      chronicleCanonicalHash: response.result.chronicleCanonicalHash,
      transitionTraceRoot: response.result.transitionTraceRoot,
    }),
    runtimeAccountingRoot: canonicalHash(response.result.accounting),
  })
}

export const currentFormationIsRealistic = (cell: LeanCell): boolean => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(({ id }) => id === cell.arenaId)
  if (!arena) return false
  const inside = ({ x, y }: { x: number; y: number }): boolean =>
    x >= arena.initialBounds.minX && x <= arena.initialBounds.maxX &&
    y >= arena.initialBounds.minY && y <= arena.initialBounds.maxY
  return [...BOTTOM_STARTING_POSITIONS, ...TOP_STARTING_POSITIONS, ...arena.terrainStones].every(inside) &&
    BOTTOM_STARTING_POSITIONS.every(({ x, y }) => x >= 2 && x <= 9 && y === 11) &&
    TOP_STARTING_POSITIONS.every(({ x, y }) => x >= 2 && x <= 9 && y === 0)
}
