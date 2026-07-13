import type {
  ArenaVariant,
  BoardBounds,
  CompatibilityVersions,
  MatchOutcome,
  PlayerId,
  Soldier,
} from "./types.js"
import {
  BOTTOM_STARTING_POSITIONS,
  ROUND_ACTIVATION_COUNTS,
  TOP_STARTING_POSITIONS,
} from "./constants.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"
import { ChronicleEventTypeSchema } from "./schemas.js"
import {
  hashCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"

export const SEMANTIC_INTEGRITY_PUBLIC_CATEGORY =
  "CANONICAL_INTEGRITY_FAILURE" as const
export const SEMANTIC_INTEGRITY_OWNERSHIP = "system_integrity" as const

export const SEMANTIC_INTEGRITY_FAMILY_ORDER = [
  "TUPLE",
  "ARENA",
  "PLAYER",
  "SOLDIER",
  "POSITION",
  "LIFECYCLE",
  "OUTCOME",
  "TRANSITION",
] as const

export type SemanticIntegrityFamily =
  (typeof SEMANTIC_INTEGRITY_FAMILY_ORDER)[number]

export const SEMANTIC_INTEGRITY_CODE_ORDER = [
  "TUPLE_SHAPE_INVALID",
  "TUPLE_UNKNOWN_COMPONENT",
  "TUPLE_MIXED_COMPONENTS",
  "ARENA_SHAPE_INVALID",
  "ARENA_BOUNDS_INVERTED",
  "ARENA_BOUNDS_DEGENERATE",
  "ARENA_TERRAIN_OUT_OF_BOUNDS",
  "ARENA_TERRAIN_DUPLICATE",
  "ARENA_TERRAIN_AUTHORITY_MISMATCH",
  "ARENA_TERRAIN_START_OVERLAP",
  "ARENA_START_NONCANONICAL",
  "PLAYER_SHAPE_INVALID",
  "PLAYER_ID_DUPLICATE",
  "PLAYER_INITIATIVE_UNKNOWN",
  "SOLDIER_SHAPE_INVALID",
  "SOLDIER_ID_DUPLICATE",
  "SOLDIER_OWNER_UNKNOWN",
  "SOLDIER_STATUS_POSITION_INCOHERENT",
  "SOLDIER_STATUS_FACING_INCOHERENT",
  "POSITION_SHAPE_INVALID",
  "POSITION_OCCUPANCY_DUPLICATE",
  "POSITION_OUT_OF_BOUNDS",
  "POSITION_TERRAIN_OCCUPIED",
  "LIFECYCLE_SHAPE_INVALID",
  "LIFECYCLE_CURSOR_INVALID",
  "LIFECYCLE_QUOTA_MISMATCH",
  "LIFECYCLE_PENDING_EFFECT_IDENTITY",
  "OUTCOME_SHAPE_INVALID",
  "OUTCOME_ACTIVE_COUNT_INCOHERENT",
  "OUTCOME_WINNER_INCOHERENT",
  "TRANSITION_SHAPE_INVALID",
  "TRANSITION_POST_TERMINAL",
  "TRANSITION_EVENT_STATE_MISMATCH",
  "TRANSITION_HASH_MISMATCH",
] as const

export type SemanticIntegrityCode =
  (typeof SEMANTIC_INTEGRITY_CODE_ORDER)[number]
export type SemanticIntegrityPathSegment = string | number
export type SemanticIntegrityMetadataValue = string | number | boolean | null

export interface SemanticIntegrityIssueInput {
  readonly code: SemanticIntegrityCode
  readonly path?: readonly SemanticIntegrityPathSegment[] | undefined
  readonly metadata?:
    | Readonly<Record<string, SemanticIntegrityMetadataValue>>
    | undefined
}

export interface SemanticIntegrityIssue {
  readonly code: SemanticIntegrityCode
  readonly path: readonly SemanticIntegrityPathSegment[]
  readonly metadata: Readonly<Record<string, SemanticIntegrityMetadataValue>>
}

export interface SemanticIntegrityLimits {
  readonly issues: number
  readonly pathSegments: number
  readonly pathBytes: number
  readonly metadataEntries: number
  readonly metadataValueBytes: number
}

export const DEFAULT_SEMANTIC_INTEGRITY_LIMITS = Object.freeze({
  issues: 16,
  pathSegments: 8,
  pathBytes: 160,
  metadataEntries: 4,
  metadataValueBytes: 64,
}) satisfies Readonly<SemanticIntegrityLimits>

export type SemanticIntegrityResult =
  | {
      readonly ok: true
      readonly issues: readonly []
      readonly truncated: false
    }
  | {
      readonly ok: false
      readonly category: typeof SEMANTIC_INTEGRITY_PUBLIC_CATEGORY
      readonly ownership: typeof SEMANTIC_INTEGRITY_OWNERSHIP
      readonly issues: readonly SemanticIntegrityIssue[]
      readonly truncated: boolean
    }

export interface SemanticIntegrityRestrictedContext {
  readonly transitionKind?: string | undefined
  readonly beforeStateHash?: string | undefined
  readonly afterStateHash?: string | undefined
}

const CODE_RANK = new Map<SemanticIntegrityCode, number>(
  SEMANTIC_INTEGRITY_CODE_ORDER.map((code, index) => [code, index]),
)

const SAFE_METADATA_KEYS = Object.freeze([
  "actual",
  "axis",
  "component",
  "count",
  "expected",
  "index",
  "rule",
  "side",
  "status",
] as const)
const SAFE_METADATA_KEY_SET = new Set<string>(SAFE_METADATA_KEYS)
const EMPTY_ISSUES = Object.freeze([]) as readonly []
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/u
const TRANSITION_KIND_PATTERN = /^[A-Z][A-Z0-9_:-]{0,63}$/u

const codePointCompare = (left: string, right: string): number => {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0)!)
  const rightPoints = Array.from(right, (value) => value.codePointAt(0)!)
  const length = Math.min(leftPoints.length, rightPoints.length)
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!
    if (difference !== 0) {
      return difference
    }
  }
  return leftPoints.length - rightPoints.length
}

const pathCompare = (
  left: readonly SemanticIntegrityPathSegment[],
  right: readonly SemanticIntegrityPathSegment[],
): number => {
  const length = Math.min(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index]!
    const rightValue = right[index]!
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      if (leftValue !== rightValue) {
        return leftValue - rightValue
      }
      continue
    }
    if (typeof leftValue === "number") return -1
    if (typeof rightValue === "number") return 1
    const difference = codePointCompare(leftValue, rightValue)
    if (difference !== 0) return difference
  }
  return left.length - right.length
}

const utf8Bytes = (value: string): number =>
  new TextEncoder().encode(value).byteLength

const truncateUtf8 = (
  value: string,
  maximumBytes: number,
): { value: string; truncated: boolean } => {
  if (utf8Bytes(value) <= maximumBytes) {
    return { value, truncated: false }
  }
  let result = ""
  let bytes = 0
  for (const character of value) {
    const characterBytes = utf8Bytes(character)
    if (bytes + characterBytes > maximumBytes) break
    result += character
    bytes += characterBytes
  }
  return { value: result, truncated: true }
}

const normalizePath = (
  path: readonly SemanticIntegrityPathSegment[],
  limits: Readonly<SemanticIntegrityLimits>,
): { path: readonly SemanticIntegrityPathSegment[]; truncated: boolean } => {
  const output: SemanticIntegrityPathSegment[] = []
  let remainingBytes = limits.pathBytes
  let truncated = path.length > limits.pathSegments
  for (const segment of path.slice(0, limits.pathSegments)) {
    const text = String(segment)
    const bounded = truncateUtf8(text, Math.max(0, remainingBytes))
    remainingBytes -= utf8Bytes(bounded.value)
    if (typeof segment === "number" && !bounded.truncated) {
      output.push(segment)
    } else {
      output.push(bounded.value)
    }
    truncated ||= bounded.truncated
    if (remainingBytes === 0) {
      truncated ||= path.length > output.length
      break
    }
  }
  return { path: Object.freeze(output), truncated }
}

const metadataValueText = (value: SemanticIntegrityMetadataValue): string =>
  typeof value === "string" ? value : String(value)

const normalizeMetadata = (
  metadata: Readonly<Record<string, SemanticIntegrityMetadataValue>>,
  limits: Readonly<SemanticIntegrityLimits>,
): {
  metadata: Readonly<Record<string, SemanticIntegrityMetadataValue>>
  truncated: boolean
} => {
  const allKeys = Object.keys(metadata).sort(codePointCompare)
  const safeKeys = allKeys.filter((key) => SAFE_METADATA_KEY_SET.has(key))
  const selectedKeys = safeKeys.slice(0, limits.metadataEntries)
  let truncated =
    safeKeys.length !== allKeys.length ||
    selectedKeys.length !== safeKeys.length
  const output: Record<string, SemanticIntegrityMetadataValue> = {}
  for (const key of selectedKeys) {
    const original = metadata[key]!
    const bounded = truncateUtf8(
      metadataValueText(original),
      limits.metadataValueBytes,
    )
    output[key] =
      typeof original === "string" || bounded.truncated
        ? bounded.value
        : original
    truncated ||= bounded.truncated
  }
  return { metadata: Object.freeze(output), truncated }
}

const normalizeLimits = (
  input: Partial<SemanticIntegrityLimits> | undefined,
): Readonly<SemanticIntegrityLimits> => {
  const positiveInteger = (
    value: number | undefined,
    fallback: number,
  ): number =>
    Number.isInteger(value) && (value ?? 0) >= 0 ? value! : fallback
  return Object.freeze({
    issues: positiveInteger(
      input?.issues,
      DEFAULT_SEMANTIC_INTEGRITY_LIMITS.issues,
    ),
    pathSegments: positiveInteger(
      input?.pathSegments,
      DEFAULT_SEMANTIC_INTEGRITY_LIMITS.pathSegments,
    ),
    pathBytes: positiveInteger(
      input?.pathBytes,
      DEFAULT_SEMANTIC_INTEGRITY_LIMITS.pathBytes,
    ),
    metadataEntries: positiveInteger(
      input?.metadataEntries,
      DEFAULT_SEMANTIC_INTEGRITY_LIMITS.metadataEntries,
    ),
    metadataValueBytes: positiveInteger(
      input?.metadataValueBytes,
      DEFAULT_SEMANTIC_INTEGRITY_LIMITS.metadataValueBytes,
    ),
  })
}

const metadataSignature = (
  metadata: Readonly<Record<string, SemanticIntegrityMetadataValue>>,
): string =>
  Object.keys(metadata)
    .sort(codePointCompare)
    .map((key) => `${key}:${typeof metadata[key]}:${String(metadata[key])}`)
    .join("\0")

const issueCompare = (
  left: SemanticIntegrityIssueInput,
  right: SemanticIntegrityIssueInput,
): number => {
  const codeDifference = CODE_RANK.get(left.code)! - CODE_RANK.get(right.code)!
  if (codeDifference !== 0) return codeDifference
  const pathDifference = pathCompare(left.path ?? [], right.path ?? [])
  if (pathDifference !== 0) return pathDifference
  return codePointCompare(
    metadataSignature(left.metadata ?? {}),
    metadataSignature(right.metadata ?? {}),
  )
}

export const createSemanticIntegrityResult = (
  inputIssues: readonly SemanticIntegrityIssueInput[],
  inputLimits?: Partial<SemanticIntegrityLimits> | undefined,
): SemanticIntegrityResult => {
  if (inputIssues.length === 0) {
    return Object.freeze({ ok: true, issues: EMPTY_ISSUES, truncated: false })
  }
  const limits = normalizeLimits(inputLimits)
  const ordered: SemanticIntegrityIssueInput[] = []
  for (const candidate of inputIssues) {
    const insertionIndex = ordered.findIndex(
      (current) => issueCompare(candidate, current) < 0,
    )
    if (insertionIndex >= 0) {
      ordered.splice(insertionIndex, 0, candidate)
    } else if (ordered.length < limits.issues) {
      ordered.push(candidate)
    }
    if (ordered.length > limits.issues) ordered.pop()
  }
  let truncated = inputIssues.length > ordered.length
  const issues = ordered.map((issue) => {
    const path = normalizePath(issue.path ?? [], limits)
    const metadata = normalizeMetadata(issue.metadata ?? {}, limits)
    truncated ||= path.truncated || metadata.truncated
    return Object.freeze({
      code: issue.code,
      path: path.path,
      metadata: metadata.metadata,
    })
  })
  return Object.freeze({
    ok: false,
    category: SEMANTIC_INTEGRITY_PUBLIC_CATEGORY,
    ownership: SEMANTIC_INTEGRITY_OWNERSHIP,
    issues: Object.freeze(issues),
    truncated,
  })
}

export const semanticIntegrityShapeFailure = (
  family: SemanticIntegrityFamily,
  path: readonly SemanticIntegrityPathSegment[] = [],
): SemanticIntegrityResult =>
  createSemanticIntegrityResult([
    {
      code: `${family}_SHAPE_INVALID` as SemanticIntegrityCode,
      path,
    },
  ])

export const projectPublicSemanticIntegrityFailure = (
  _result: Exclude<SemanticIntegrityResult, { ok: true }>,
) => Object.freeze({ category: SEMANTIC_INTEGRITY_PUBLIC_CATEGORY })

export const projectRestrictedSemanticIntegrityFailure = (
  result: Exclude<SemanticIntegrityResult, { ok: true }>,
  context: SemanticIntegrityRestrictedContext = {},
) => {
  const transitionKind =
    context.transitionKind === undefined ||
    !TRANSITION_KIND_PATTERN.test(context.transitionKind)
      ? undefined
      : truncateUtf8(context.transitionKind, 64).value
  const beforeStateHash =
    context.beforeStateHash !== undefined &&
    HASH_PATTERN.test(context.beforeStateHash)
      ? context.beforeStateHash
      : undefined
  const afterStateHash =
    context.afterStateHash !== undefined &&
    HASH_PATTERN.test(context.afterStateHash)
      ? context.afterStateHash
      : undefined
  return Object.freeze({
    category: result.category,
    ownership: result.ownership,
    issues: result.issues,
    truncated: result.truncated,
    ...(transitionKind === undefined ? {} : { transitionKind }),
    ...(beforeStateHash === undefined ? {} : { beforeStateHash }),
    ...(afterStateHash === undefined ? {} : { afterStateHash }),
  })
}

export interface CanonicalSemanticPlayer {
  readonly id: PlayerId
  readonly side: "bottom" | "top"
  readonly strategyRevisionId: string
  readonly strategyMemory: unknown
}

export interface CanonicalSemanticGameState {
  readonly matchId: string
  readonly seed: string
  readonly versions: CompatibilityVersions
  readonly arenaVariant: ArenaVariant
  readonly players: readonly CanonicalSemanticPlayer[]
  readonly phase: "ROUND" | "CONTRACTION" | "COMPLETE"
  readonly phaseNumber: number
  readonly roundNumber: 1 | 2 | 3 | 4
  readonly activationCount: 1 | 2 | 3 | 4
  readonly initiativePlayerId: PlayerId
  readonly bounds: BoardBounds
  readonly soldiers: readonly Soldier[]
  readonly terrainStones: readonly { readonly x: number; readonly y: number }[]
  readonly outcome?: MatchOutcome | undefined
}

export interface CanonicalSemanticLifecycle {
  readonly phaseNumber: number
  readonly roundNumber: number
  readonly activationCount: number
  readonly activationIndex: number
  readonly cycleIndex: number
  readonly activationId: string
  readonly actingPlayerId: PlayerId
  readonly soldierId: string
  readonly roundQuota: number
  readonly pendingEffectId: string
}

export interface CanonicalSemanticTransitionEvent {
  readonly type: string
  readonly sequence: number
  readonly soldierId?: string | undefined
}

export interface CanonicalLegacySemanticTransition {
  readonly kind: string
  readonly versions?: CompatibilityVersions | undefined
  readonly lifecycle: CanonicalSemanticLifecycle
  readonly inputClassification: string
  readonly events: readonly CanonicalSemanticTransitionEvent[]
  readonly beforeStateHash: string
  readonly afterStateHash: string
  readonly terminal: boolean
}

export interface CanonicalKernelSemanticTransition {
  readonly transitionKind: string
  readonly semanticTupleId: string
  readonly semanticTuple: Readonly<CanonicalCompatibilityTuple>
  readonly coordinates: Readonly<{
    phaseNumber: number
    roundNumber: number
    stage: string
    ordinal: number
    cycleIndex?: number | undefined
    activationId?: string | undefined
    activationIndex?: number | undefined
  }>
  readonly classification: string
  readonly events: readonly CanonicalSemanticTransitionEvent[]
  readonly beforeStateHash: string
  readonly afterStateHash: string
  readonly beforeMachineHash: string
  readonly afterMachineHash: string
  readonly terminalStatus: MatchOutcome | null
  readonly failureStatus: null
}

export type CanonicalSemanticTransition =
  | CanonicalLegacySemanticTransition
  | CanonicalKernelSemanticTransition

const issue = (
  code: SemanticIntegrityCode,
  path: readonly SemanticIntegrityPathSegment[],
  metadata: Readonly<Record<string, SemanticIntegrityMetadataValue>> = {},
): SemanticIntegrityIssueInput => ({ code, path, metadata })

const positionKey = (position: {
  readonly x: number
  readonly y: number
}): string => `${position.x},${position.y}`

const isWithinBounds = (
  position: { readonly x: number; readonly y: number },
  bounds: BoardBounds,
): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

const boundsAreOrdered = (bounds: BoardBounds): boolean =>
  bounds.minX <= bounds.maxX && bounds.minY <= bounds.maxY

const boundsAreNondegenerate = (bounds: BoardBounds): boolean =>
  bounds.minX < bounds.maxX && bounds.minY < bounds.maxY

const collectTupleIssues = (
  versions: CompatibilityVersions,
  pathPrefix: readonly SemanticIntegrityPathSegment[] = ["versions"],
): SemanticIntegrityIssueInput[] => {
  const issues: SemanticIntegrityIssueInput[] = []
  const componentPatterns: Record<keyof CompatibilityVersions, RegExp> = {
    spec: /^cowards-rules-v/u,
    engine: /^\d+\.\d+\.\d+(?:[-+].*)?$/u,
    runtimeJs: /^\d+\.\d+\.\d+(?:[-+].*)?$/u,
    chronicle: /^chronicle-v/u,
    strategyRevision: /^\d+\.\d+\.\d+(?:[-+].*)?$/u,
    arenaVariant: /^\d+\.\d+\.\d+(?:[-+].*)?$/u,
  }
  let hasRecognizedMismatch = false
  for (const component of Object.keys(COMPATIBILITY_VERSIONS) as Array<
    keyof CompatibilityVersions
  >) {
    const actual = versions[component]
    if (actual === COMPATIBILITY_VERSIONS[component]) continue
    if (componentPatterns[component].test(actual)) {
      hasRecognizedMismatch = true
      continue
    }
    issues.push(
      issue("TUPLE_UNKNOWN_COMPONENT", [...pathPrefix, component], {
        component,
      }),
    )
  }
  if (hasRecognizedMismatch) {
    issues.push(issue("TUPLE_MIXED_COMPONENTS", pathPrefix))
  }
  return issues
}

const collectArenaIssues = (
  arena: ArenaVariant,
  options: { readonly includeCanonicalStarts: boolean },
): SemanticIntegrityIssueInput[] => {
  const issues: SemanticIntegrityIssueInput[] = []
  for (const axis of ["x", "y"] as const) {
    const minimum =
      axis === "x" ? arena.initialBounds.minX : arena.initialBounds.minY
    const maximum =
      axis === "x" ? arena.initialBounds.maxX : arena.initialBounds.maxY
    if (minimum > maximum) {
      issues.push(
        issue(
          "ARENA_BOUNDS_INVERTED",
          ["initialBounds", axis === "x" ? "maxX" : "maxY"],
          {
            axis,
          },
        ),
      )
    } else if (minimum === maximum) {
      issues.push(issue("ARENA_BOUNDS_DEGENERATE", ["initialBounds"], { axis }))
    }
  }

  const seenTerrain = new Set<string>()
  arena.terrainStones.forEach((position, index) => {
    const key = positionKey(position)
    if (!isWithinBounds(position, arena.initialBounds)) {
      issues.push(
        issue("ARENA_TERRAIN_OUT_OF_BOUNDS", ["terrainStones", index]),
      )
    }
    if (seenTerrain.has(key)) {
      issues.push(issue("ARENA_TERRAIN_DUPLICATE", ["terrainStones", index]))
    }
    seenTerrain.add(key)
  })

  if (
    options.includeCanonicalStarts &&
    boundsAreOrdered(arena.initialBounds) &&
    boundsAreNondegenerate(arena.initialBounds)
  ) {
    const startingSide = new Map<string, "bottom" | "top">([
      ...BOTTOM_STARTING_POSITIONS.map(
        (position) => [positionKey(position), "bottom"] as const,
      ),
      ...TOP_STARTING_POSITIONS.map(
        (position) => [positionKey(position), "top"] as const,
      ),
    ])
    arena.terrainStones.forEach((position, index) => {
      const side = startingSide.get(positionKey(position))
      if (side !== undefined) {
        issues.push(
          issue("ARENA_TERRAIN_START_OVERLAP", ["terrainStones", index], {
            side,
          }),
        )
      }
    })
    const admitted = [
      ...BOTTOM_STARTING_POSITIONS.map(
        (position) => ({ position, side: "bottom" }) as const,
      ),
      ...TOP_STARTING_POSITIONS.map(
        (position) => ({ position, side: "top" }) as const,
      ),
    ]
    const missing = admitted.find(
      ({ position }) => !isWithinBounds(position, arena.initialBounds),
    )
    if (missing !== undefined) {
      issues.push(
        issue("ARENA_START_NONCANONICAL", ["initialBounds"], {
          side: missing.side,
        }),
      )
    }
  }
  return issues
}

export const validateCanonicalArena = (
  arena: ArenaVariant,
): SemanticIntegrityResult =>
  createSemanticIntegrityResult(
    collectArenaIssues(arena, { includeCanonicalStarts: true }),
  )

const collectStateIssues = (
  state: CanonicalSemanticGameState,
): SemanticIntegrityIssueInput[] => {
  const issues = [
    ...collectTupleIssues(state.versions),
    ...collectArenaIssues(state.arenaVariant, {
      includeCanonicalStarts: false,
    }),
  ]
  const playerIds = new Set<string>()
  const sideIds = new Set<string>()
  state.players.forEach((player, index) => {
    if (playerIds.has(player.id) || sideIds.has(player.side)) {
      issues.push(issue("PLAYER_ID_DUPLICATE", ["players", index, "id"]))
    }
    playerIds.add(player.id)
    sideIds.add(player.side)
  })
  if (!playerIds.has(state.initiativePlayerId)) {
    issues.push(issue("PLAYER_INITIATIVE_UNKNOWN", ["initiativePlayerId"]))
  }

  const initial = state.arenaVariant.initialBounds
  const contractionDepths = [
    state.bounds.minX - initial.minX,
    initial.maxX - state.bounds.maxX,
    state.bounds.minY - initial.minY,
    initial.maxY - state.bounds.maxY,
  ]
  const contractionDepth = contractionDepths[0]!
  const allowedDepths =
    state.phase === "COMPLETE"
      ? new Set([state.phaseNumber - 1, state.phaseNumber])
      : new Set([state.phaseNumber - 1])
  if (
    !boundsAreOrdered(state.bounds) ||
    !boundsAreNondegenerate(state.bounds) ||
    !contractionDepths.every(
      (depth) =>
        Number.isSafeInteger(depth) &&
        depth >= 0 &&
        depth === contractionDepth,
    ) ||
    !allowedDepths.has(contractionDepth)
  ) {
    issues.push(issue("ARENA_BOUNDS_INVERTED", ["bounds"]))
  }

  const currentTerrainKeys = state.terrainStones.map(positionKey)
  const currentTerrainSet = new Set(currentTerrainKeys)
  state.terrainStones.forEach((position, index) => {
    if (!isWithinBounds(position, state.bounds)) {
      issues.push(
        issue("ARENA_TERRAIN_OUT_OF_BOUNDS", ["terrainStones", index]),
      )
    }
    if (currentTerrainKeys.indexOf(positionKey(position)) !== index) {
      issues.push(issue("ARENA_TERRAIN_DUPLICATE", ["terrainStones", index]))
    }
  })
  const authoritativeTerrain = new Set(
    state.arenaVariant.terrainStones
      .filter((position) => isWithinBounds(position, state.bounds))
      .map(positionKey),
  )
  if (
    currentTerrainSet.size !== authoritativeTerrain.size ||
    [...authoritativeTerrain].some((key) => !currentTerrainSet.has(key))
  ) {
    issues.push(
      issue("ARENA_TERRAIN_AUTHORITY_MISMATCH", ["terrainStones"]),
    )
  }

  if (
    !Number.isSafeInteger(state.phaseNumber) ||
    state.phaseNumber < 1 ||
    !Number.isSafeInteger(state.roundNumber) ||
    state.roundNumber < 1 ||
    state.roundNumber > 4
  ) {
    issues.push(issue("LIFECYCLE_CURSOR_INVALID", ["phaseNumber"]))
  }
  if (state.activationCount !== ROUND_ACTIVATION_COUNTS[state.roundNumber]) {
    issues.push(issue("LIFECYCLE_QUOTA_MISMATCH", ["activationCount"]))
  }

  const soldierIds = new Set<string>()
  const occupied = new Set<string>()
  const terrain = new Set(state.terrainStones.map(positionKey))
  state.soldiers.forEach((soldier, index) => {
    if (soldierIds.has(soldier.id)) {
      issues.push(issue("SOLDIER_ID_DUPLICATE", ["soldiers", index, "id"]))
    }
    soldierIds.add(soldier.id)
    if (!playerIds.has(soldier.ownerPlayerId)) {
      issues.push(
        issue("SOLDIER_OWNER_UNKNOWN", ["soldiers", index, "ownerPlayerId"]),
      )
    }

    if (
      (soldier.status === "ACTIVE" || soldier.status === "STONE") &&
      soldier.position === null
    ) {
      issues.push(
        issue(
          "SOLDIER_STATUS_POSITION_INCOHERENT",
          ["soldiers", index, "position"],
          { status: soldier.status },
        ),
      )
    }
    if (soldier.status === "FALLEN" && soldier.position !== null) {
      issues.push(
        issue(
          "SOLDIER_STATUS_POSITION_INCOHERENT",
          ["soldiers", index, "position"],
          { status: soldier.status },
        ),
      )
    }
    if (
      (soldier.status === "ACTIVE" || soldier.status === "STONE") &&
      soldier.facing === null
    ) {
      issues.push(
        issue(
          "SOLDIER_STATUS_FACING_INCOHERENT",
          ["soldiers", index, "facing"],
          { status: soldier.status },
        ),
      )
    }

    if (soldier.position === null || soldier.status === "FALLEN") return
    const key = positionKey(soldier.position)
    if (occupied.has(key)) {
      issues.push(
        issue("POSITION_OCCUPANCY_DUPLICATE", ["soldiers", index, "position"]),
      )
    }
    occupied.add(key)
    if (!isWithinBounds(soldier.position, state.bounds)) {
      issues.push(
        issue("POSITION_OUT_OF_BOUNDS", ["soldiers", index, "position"]),
      )
    }
    if (terrain.has(key)) {
      issues.push(
        issue("POSITION_TERRAIN_OCCUPIED", ["soldiers", index, "position"]),
      )
    }
  })

  const activeCounts = new Map<string, number>(
    state.players.map((player) => [player.id, 0]),
  )
  for (const soldier of state.soldiers) {
    if (
      soldier.status === "ACTIVE" &&
      activeCounts.has(soldier.ownerPlayerId)
    ) {
      activeCounts.set(
        soldier.ownerPlayerId,
        activeCounts.get(soldier.ownerPlayerId)! + 1,
      )
    }
  }
  const counts = state.players.map((player) => activeCounts.get(player.id) ?? 0)
  if (state.phase === "COMPLETE" && state.outcome === undefined) {
    issues.push(issue("OUTCOME_ACTIVE_COUNT_INCOHERENT", ["outcome"]))
  } else if (state.phase !== "COMPLETE" && state.outcome !== undefined) {
    issues.push(issue("OUTCOME_ACTIVE_COUNT_INCOHERENT", ["outcome"]))
  } else if (
    state.phase !== "COMPLETE" &&
    counts.some((count) => count === 0)
  ) {
    issues.push(issue("OUTCOME_ACTIVE_COUNT_INCOHERENT", ["outcome"]))
  }
  const outcome = state.outcome
  if (outcome?.type === "WIN") {
    const winnerIndex = state.players.findIndex(
      (player) => player.id === outcome.winnerPlayerId,
    )
    if (winnerIndex < 0) {
      issues.push(
        issue("OUTCOME_WINNER_INCOHERENT", ["outcome", "winnerPlayerId"]),
      )
    } else {
      const loserIndex = winnerIndex === 0 ? 1 : 0
      if ((counts[winnerIndex] ?? 0) <= (counts[loserIndex] ?? 0)) {
        issues.push(issue("OUTCOME_ACTIVE_COUNT_INCOHERENT", ["outcome"]))
      }
    }
  } else if (
    outcome?.type === "DRAW" &&
    (counts[0] ?? 0) !== (counts[1] ?? 0)
  ) {
    issues.push(issue("OUTCOME_ACTIVE_COUNT_INCOHERENT", ["outcome"]))
  }
  return issues
}

export const validateCanonicalGameState = (
  state: CanonicalSemanticGameState,
): SemanticIntegrityResult =>
  createSemanticIntegrityResult(collectStateIssues(state))

export const validateCanonicalInitialGameState = (
  state: CanonicalSemanticGameState,
): SemanticIntegrityResult => {
  const issues = collectStateIssues(state)
  const playersBySide = new Map(
    state.players.map((player) => [player.side, player.id]),
  )
  const expectedBySide = {
    bottom: new Set(BOTTOM_STARTING_POSITIONS.map(positionKey)),
    top: new Set(TOP_STARTING_POSITIONS.map(positionKey)),
  }
  for (const side of ["bottom", "top"] as const) {
    const ownerPlayerId = playersBySide.get(side)
    const sideSoldiers = state.soldiers
      .map((soldier, index) => ({ soldier, index }))
      .filter(({ soldier }) => soldier.ownerPlayerId === ownerPlayerId)
    const positions = new Set(
      sideSoldiers
        .filter(({ soldier }) => soldier.position !== null)
        .map(({ soldier }) => positionKey(soldier.position!)),
    )
    const invalid = sideSoldiers.find(
      ({ soldier }) =>
        soldier.status !== "ACTIVE" ||
        soldier.position === null ||
        !expectedBySide[side].has(positionKey(soldier.position)),
    )
    if (
      invalid !== undefined ||
      sideSoldiers.length !== expectedBySide[side].size ||
      positions.size !== expectedBySide[side].size
    ) {
      issues.push(
        issue(
          "ARENA_START_NONCANONICAL",
          invalid === undefined
            ? ["soldiers"]
            : ["soldiers", invalid.index, "position"],
          { side },
        ),
      )
    }
  }
  return createSemanticIntegrityResult(issues)
}

export const validateCanonicalTransition = (
  transition: CanonicalSemanticTransition,
): SemanticIntegrityResult => {
  const issues: SemanticIntegrityIssueInput[] = []
  if ("semanticTupleId" in transition) {
    const tuple = transition.semanticTuple
    const tupleKeys = Object.keys(tuple).sort()
    const expectedTupleKeys = [
      "arenaCatalog",
      "chronicle",
      "engine",
      "rules",
      "runtimeAbi",
      "setPolicy",
    ]
    const tupleValues = expectedTupleKeys.map(
      (key) => tuple[key as keyof CanonicalCompatibilityTuple],
    )
    if (
      JSON.stringify(tupleKeys) !== JSON.stringify(expectedTupleKeys) ||
      tupleValues.some((value) => typeof value !== "string" || value === "") ||
      transition.semanticTupleId !==
        `sha256:${hashCanonicalCompatibilityTuple(tuple)}`
    ) {
      issues.push(issue("TUPLE_SHAPE_INVALID", ["semanticTupleId"]))
    }
    const coordinates = transition.coordinates
    const activationCoordinatesValid =
      coordinates.activationIndex === undefined ||
      (Number.isSafeInteger(coordinates.activationIndex) &&
        coordinates.activationIndex >= 0 &&
        coordinates.activationId ===
          `${coordinates.phaseNumber}:${coordinates.roundNumber}:${coordinates.activationIndex}`)
    if (
      !Number.isSafeInteger(coordinates.phaseNumber) ||
      coordinates.phaseNumber < 1 ||
      !Number.isSafeInteger(coordinates.roundNumber) ||
      coordinates.roundNumber < 1 ||
      coordinates.roundNumber > 4 ||
      !Number.isSafeInteger(coordinates.ordinal) ||
      coordinates.ordinal < 0 ||
      !TRANSITION_KIND_PATTERN.test(transition.transitionKind) ||
      !activationCoordinatesValid
    ) {
      issues.push(issue("LIFECYCLE_CURSOR_INVALID", ["coordinates"]))
    }
    if (
      !HASH_PATTERN.test(transition.beforeStateHash) ||
      !HASH_PATTERN.test(transition.afterStateHash) ||
      !HASH_PATTERN.test(transition.beforeMachineHash) ||
      !HASH_PATTERN.test(transition.afterMachineHash) ||
      transition.beforeMachineHash === transition.afterMachineHash ||
      transition.failureStatus !== null
    ) {
      issues.push(issue("TRANSITION_HASH_MISMATCH", ["afterMachineHash"]))
    }
    const firstSequence = transition.events[0]?.sequence
    if (
      transition.events.length === 0 ||
      firstSequence === undefined ||
      !Number.isSafeInteger(firstSequence) ||
      transition.events.some(
        (event, index) =>
          !ChronicleEventTypeSchema.safeParse(event.type).success ||
          !Number.isSafeInteger(event.sequence) ||
          event.sequence !== firstSequence + index,
      )
    ) {
      issues.push(issue("TRANSITION_SHAPE_INVALID", ["events"]))
    }
    const terminalIndexes = transition.events
      .map((event, index) => (event.type === "MATCH_ENDED" ? index : -1))
      .filter((index) => index >= 0)
    if (
      terminalIndexes.length > 1 ||
      (terminalIndexes.length === 1 &&
        terminalIndexes[0] !== transition.events.length - 1) ||
      (transition.terminalStatus === null) !== (terminalIndexes.length === 0)
    ) {
      issues.push(issue("TRANSITION_POST_TERMINAL", ["events", 0]))
    }
    return createSemanticIntegrityResult(issues)
  }
  if (transition.versions !== undefined) {
    issues.push(...collectTupleIssues(transition.versions))
  }
  const lifecycle = transition.lifecycle
  const expectedActivationId = `activation:${lifecycle.phaseNumber}:${lifecycle.roundNumber}:${lifecycle.activationIndex}`
  if (
    !Number.isInteger(lifecycle.phaseNumber) ||
    lifecycle.phaseNumber < 1 ||
    !Number.isInteger(lifecycle.roundNumber) ||
    lifecycle.roundNumber < 1 ||
    lifecycle.roundNumber > 4 ||
    !Number.isInteger(lifecycle.activationIndex) ||
    lifecycle.activationIndex < 0 ||
    lifecycle.activationIndex >= lifecycle.activationCount ||
    !Number.isInteger(lifecycle.cycleIndex) ||
    lifecycle.cycleIndex < 0 ||
    lifecycle.activationId !== expectedActivationId
  ) {
    issues.push(
      issue("LIFECYCLE_CURSOR_INVALID", ["lifecycle", "activationIndex"]),
    )
  }
  if (lifecycle.roundQuota !== lifecycle.activationCount) {
    issues.push(issue("LIFECYCLE_QUOTA_MISMATCH", ["lifecycle", "roundQuota"]))
  }
  if (lifecycle.pendingEffectId !== `effect:${lifecycle.activationId}`) {
    issues.push(
      issue("LIFECYCLE_PENDING_EFFECT_IDENTITY", [
        "lifecycle",
        "pendingEffectId",
      ]),
    )
  }
  const terminalIndexes = transition.events
    .map((event, index) => (event.type === "MATCH_ENDED" ? index : -1))
    .filter((index) => index >= 0)
  if (
    (transition.terminal &&
      (terminalIndexes.length !== 1 ||
        terminalIndexes[0] !== transition.events.length - 1)) ||
    (!transition.terminal && terminalIndexes.length > 0)
  ) {
    issues.push(issue("TRANSITION_POST_TERMINAL", ["events", 0]))
  }
  if (
    !transition.terminal &&
    transition.events.length > 0 &&
    transition.beforeStateHash === transition.afterStateHash
  ) {
    issues.push(issue("TRANSITION_EVENT_STATE_MISMATCH", ["events", 0]))
  }
  if (
    transition.events.length === 0 &&
    transition.beforeStateHash !== transition.afterStateHash
  ) {
    issues.push(issue("TRANSITION_HASH_MISMATCH", ["afterStateHash"]))
  }
  return createSemanticIntegrityResult(issues)
}
