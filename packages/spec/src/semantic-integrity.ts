import type {
  ArenaVariant,
  BoardBounds,
  CompatibilityVersions,
  MatchOutcome,
  PlayerId,
  Soldier,
} from "./types.js"

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
    safeKeys.length !== allKeys.length || selectedKeys.length !== safeKeys.length
  const output: Record<string, SemanticIntegrityMetadataValue> = {}
  for (const key of selectedKeys) {
    const original = metadata[key]!
    const bounded = truncateUtf8(
      metadataValueText(original),
      limits.metadataValueBytes,
    )
    output[key] =
      typeof original === "string" || bounded.truncated ? bounded.value : original
    truncated ||= bounded.truncated
  }
  return { metadata: Object.freeze(output), truncated }
}

const normalizeLimits = (
  input: Partial<SemanticIntegrityLimits> | undefined,
): Readonly<SemanticIntegrityLimits> => {
  const positiveInteger = (value: number | undefined, fallback: number): number =>
    Number.isInteger(value) && (value ?? 0) >= 0 ? value! : fallback
  return Object.freeze({
    issues: positiveInteger(input?.issues, DEFAULT_SEMANTIC_INTEGRITY_LIMITS.issues),
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

const issueCompare = (
  left: SemanticIntegrityIssueInput,
  right: SemanticIntegrityIssueInput,
): number => {
  const codeDifference = CODE_RANK.get(left.code)! - CODE_RANK.get(right.code)!
  if (codeDifference !== 0) return codeDifference
  return pathCompare(left.path ?? [], right.path ?? [])
}

export const createSemanticIntegrityResult = (
  inputIssues: readonly SemanticIntegrityIssueInput[],
  inputLimits?: Partial<SemanticIntegrityLimits> | undefined,
): SemanticIntegrityResult => {
  if (inputIssues.length === 0) {
    return Object.freeze({ ok: true, issues: EMPTY_ISSUES, truncated: false })
  }
  const limits = normalizeLimits(inputLimits)
  const ordered = [...inputIssues].sort(issueCompare)
  let truncated = ordered.length > limits.issues
  const issues = ordered.slice(0, limits.issues).map((issue) => {
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
    context.transitionKind === undefined
      ? undefined
      : truncateUtf8(context.transitionKind, 64).value
  const beforeStateHash =
    context.beforeStateHash !== undefined && HASH_PATTERN.test(context.beforeStateHash)
      ? context.beforeStateHash
      : undefined
  const afterStateHash =
    context.afterStateHash !== undefined && HASH_PATTERN.test(context.afterStateHash)
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

