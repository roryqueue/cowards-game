import { createHash } from "node:crypto"
import {
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
  encodeCanonicalJson,
  projectRestrictedSemanticIntegrityFailure,
  validateCanonicalGameState,
  type CanonicalCompatibilityTuple,
  type JsonValue,
  type SemanticIntegrityResult,
} from "@cowards/spec"
import type { GameState, TransitionEventSummary } from "../types.js"
import type {
  KernelCoordinates,
  KernelEffectRequest,
  KernelInput,
  KernelRestrictedFailure,
  KernelRecorderMaterial,
  KernelSemanticTuple,
  KernelTransitionRecord,
  MatchMachine,
} from "./types.js"
import {
  CANDIDATE_KERNEL_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID,
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
  CANDIDATE_KERNEL_V119_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_V119_SEMANTIC_TUPLE_ID,
} from "./types.js"

const registeredKernelTuple = (tuple: KernelSemanticTuple): boolean =>
  (tuple.tupleId === HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID &&
    JSON.stringify(projectTuple(tuple.tuple)) ===
      JSON.stringify(HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE)) ||
  (tuple.tupleId === CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID &&
    JSON.stringify(projectTuple(tuple.tuple)) ===
      JSON.stringify(CANDIDATE_KERNEL_SEMANTIC_TUPLE)) ||
  (tuple.tupleId === CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID &&
    JSON.stringify(projectTuple(tuple.tuple)) ===
      JSON.stringify(CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE)) ||
  (tuple.tupleId === CANDIDATE_KERNEL_V119_SEMANTIC_TUPLE_ID &&
    JSON.stringify(projectTuple(tuple.tuple)) ===
      JSON.stringify(CANDIDATE_KERNEL_V119_SEMANTIC_TUPLE))

const MACHINE_HASH_DOMAIN =
  "cowards-game:candidate-match-machine-projection:v1" as const
const STATE_HASH_DOMAIN =
  "cowards-game:candidate-game-state-projection:v1" as const
const RECORDER_HASH_DOMAIN =
  "cowards-game:candidate-recorder-material:v1" as const
const V117_EFFECT_REQUEST_HASH_DOMAIN =
  "cowards-game:kernel-effect-request:v1.17" as const
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/u

const kernelOwnedEventHistories = new WeakSet<object>()
const kernelOwnedEventSummaries = new WeakSet<object>()
const kernelEventHistoryExtensions = new WeakMap<
  object,
  Readonly<{
    before: readonly TransitionEventSummary[]
    appended: readonly TransitionEventSummary[]
  }>
>()
const kernelOwnedRequestIdHistories = new WeakSet<object>()
const kernelRequestIdHistoryExtensions = new WeakMap<
  object,
  Readonly<{ before: readonly string[]; appended: string }>
>()

const deepFreezeDetached = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeDetached(child)
    }
    Object.freeze(value)
  }
  return value
}

export const createKernelEventHistory =
  (): readonly TransitionEventSummary[] => {
    const history = Object.freeze([]) as readonly TransitionEventSummary[]
    kernelOwnedEventHistories.add(history)
    return history
  }

export const appendKernelEventHistory = (
  before: readonly TransitionEventSummary[],
  appended: readonly TransitionEventSummary[],
): Readonly<{
  events: readonly TransitionEventSummary[]
  fullEvents: readonly TransitionEventSummary[]
}> => {
  if (!kernelOwnedEventHistories.has(before)) {
    return { events: appended, fullEvents: [...before, ...appended] }
  }
  const events = Object.freeze(
    appended.map((summary) => {
      const detached = deepFreezeDetached(globalThis.structuredClone(summary))
      kernelOwnedEventSummaries.add(detached)
      return detached
    }),
  )
  const fullEvents = Object.freeze([...before, ...events])
  kernelOwnedEventHistories.add(fullEvents)
  kernelEventHistoryExtensions.set(fullEvents, { before, appended: events })
  return { events, fullEvents }
}

export const createKernelRequestIdHistory = (): readonly string[] => {
  const history = Object.freeze([]) as readonly string[]
  kernelOwnedRequestIdHistories.add(history)
  return history
}

export const appendKernelRequestIdHistory = (
  before: readonly string[],
  appended: string,
): readonly string[] => {
  if (!kernelOwnedRequestIdHistories.has(before)) return [...before, appended]
  const history = Object.freeze([...before, appended])
  kernelOwnedRequestIdHistories.add(history)
  kernelRequestIdHistoryExtensions.set(history, { before, appended })
  return history
}

const codePointCompare = (left: string, right: string): number => {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0)!)
  const rightPoints = Array.from(right, (value) => value.codePointAt(0)!)
  const length = Math.min(leftPoints.length, rightPoints.length)
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index]! - rightPoints[index]!
    if (difference !== 0) return difference
  }
  return leftPoints.length - rightPoints.length
}

const projectTuple = (tuple: CanonicalCompatibilityTuple) => ({
  rules: tuple.rules,
  engine: tuple.engine,
  runtimeAbi: tuple.runtimeAbi,
  chronicle: tuple.chronicle,
  arenaCatalog: tuple.arenaCatalog,
  setPolicy: tuple.setPolicy,
})

export const projectCanonicalStateForRecording = (state: GameState) => ({
  matchId: state.matchId,
  seed: state.seed,
  versions: {
    spec: state.versions.spec,
    engine: state.versions.engine,
    runtimeJs: state.versions.runtimeJs,
    chronicle: state.versions.chronicle,
    strategyRevision: state.versions.strategyRevision,
    arenaVariant: state.versions.arenaVariant,
  },
  arenaVariant: {
    id: state.arenaVariant.id,
    name: state.arenaVariant.name,
    initialBounds: {
      minX: state.arenaVariant.initialBounds.minX,
      maxX: state.arenaVariant.initialBounds.maxX,
      minY: state.arenaVariant.initialBounds.minY,
      maxY: state.arenaVariant.initialBounds.maxY,
    },
    terrainStones: [...state.arenaVariant.terrainStones]
      .map(({ x, y }) => ({ x, y }))
      .sort((left, right) => left.x - right.x || left.y - right.y),
  },
  players: [...state.players]
    .map((player) => ({
      id: player.id,
      side: player.side,
      strategyRevisionId: player.strategyRevisionId,
    }))
    .sort((left, right) => codePointCompare(left.id, right.id)),
  phase: state.phase,
  phaseNumber: state.phaseNumber,
  roundNumber: state.roundNumber,
  activationCount: state.activationCount,
  initiativePlayerId: state.initiativePlayerId,
  bounds: {
    minX: state.bounds.minX,
    maxX: state.bounds.maxX,
    minY: state.bounds.minY,
    maxY: state.bounds.maxY,
  },
  soldiers: [...state.soldiers]
    .map((soldier) => ({
      id: soldier.id,
      ownerPlayerId: soldier.ownerPlayerId,
      status: soldier.status,
      position:
        soldier.position === null
          ? null
          : { x: soldier.position.x, y: soldier.position.y },
      facing: soldier.facing,
      lastSuccessfulMoveDirection: soldier.lastSuccessfulMoveDirection,
    }))
    .sort((left, right) => codePointCompare(left.id, right.id)),
  terrainStones: [...state.terrainStones]
    .map(({ x, y }) => ({ x, y }))
    .sort((left, right) => left.x - right.x || left.y - right.y),
  outcome: state.outcome ?? null,
})

export const hashCanonicalState = (state: GameState): string =>
  `sha256:${createHash("sha256")
    .update(`${STATE_HASH_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(projectCanonicalStateForRecording(state)), "utf8")
    .digest("hex")}`

export const projectMatchMachineForHash = (machine: MatchMachine) => ({
  executionMode: machine.executionMode,
  semanticTupleId: machine.semanticTuple.tupleId,
  semanticTuple: projectTuple(machine.semanticTuple.tuple),
  state: projectCanonicalStateForRecording(machine.state),
  cursor: {
    stage: machine.cursor.stage,
    ordinal: machine.cursor.ordinal,
    phaseNumber: machine.cursor.phaseNumber,
    roundNumber: machine.cursor.roundNumber,
    cycleLayer: machine.cursor.cycleLayer,
    slotIndex: machine.cursor.slotIndex,
  },
  maxPhases: machine.maxPhases,
  phasesRun: machine.phasesRun,
  pendingEffect:
    machine.pendingEffect === undefined
      ? null
      : {
          requestId: machine.pendingEffect.requestId,
          kind: machine.pendingEffect.kind,
          semanticTupleId: machine.pendingEffect.semanticTupleId,
          coordinates: machine.pendingEffect.coordinates,
        },
  selections: {
    bottom: machine.selections.bottom.map(({ soldierId }) => ({ soldierId })),
    top: machine.selections.top.map(({ soldierId }) => ({ soldierId })),
  },
  slots: machine.slots.map((slot) => ({
    activationId: slot.activationId,
    activationIndex: slot.activationIndex,
    actingPlayerId: slot.actingPlayerId,
    soldierId: slot.soldierId,
    cycleIndex: slot.cycleIndex,
    advanced: slot.advanced,
    ended: slot.ended,
    terminalReason: slot.terminalReason ?? null,
  })),
  consumedRequestIds:
    machine.semanticTuple.tupleId ===
    CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID
      ? {
          commitment: requestIdHistoryCommitment(machine.consumedRequestIds),
          count: machine.consumedRequestIds.length,
        }
      : [...machine.consumedRequestIds].sort(codePointCompare),
})

export const hashMatchMachine = (machine: MatchMachine): string =>
  `sha256:${createHash("sha256")
    .update(`${MACHINE_HASH_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(projectMatchMachineForHash(machine)), "utf8")
    .digest("hex")}`

export const hashKernelRecorderMaterial = (
  material: Omit<KernelRecorderMaterial, "integrityHash">,
): string =>
  `sha256:${createHash("sha256")
    .update(`${RECORDER_HASH_DOMAIN}\0`, "utf8")
    .update(
      JSON.stringify({
        semanticTupleId:
          material.boundaries[0]?.semanticTupleId ??
          CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID,
        events: material.events,
        initialState: projectCanonicalStateForRecording(material.initialState),
        finalState: projectCanonicalStateForRecording(material.finalState),
        boundaries: material.boundaries,
      }),
      "utf8",
    )
    .digest("hex")}`

const integrityFailure = (
  code: string,
  result?: Exclude<SemanticIntegrityResult, { ok: true }>,
): KernelRestrictedFailure => ({
  classification: "system_failure",
  category: "CANONICAL_INTEGRITY_FAILURE",
  ownership: "system_integrity",
  code,
  retryable: false,
  ...(result === undefined
    ? {}
    : {
        issues: projectRestrictedSemanticIntegrityFailure(result).issues,
      }),
})

const isPreservedV14ActivationState = (
  machine: MatchMachine,
  result: Exclude<SemanticIntegrityResult, { ok: true }>,
): boolean => {
  if (machine.executionMode !== "activation") return false
  const { bounds, arenaVariant } = machine.state
  const initial = arenaVariant.initialBounds
  const isOrderedSubset =
    bounds.minX < bounds.maxX &&
    bounds.minY < bounds.maxY &&
    bounds.minX >= initial.minX &&
    bounds.maxX <= initial.maxX &&
    bounds.minY >= initial.minY &&
    bounds.maxY <= initial.maxY
  if (!isOrderedSubset) return false

  // Immutable v1.4 compatibility evidence includes isolated action fixtures
  // whose current board is authoritative but was not derived by replaying
  // contractions from arenaVariant. Only those two derivation diagnostics are
  // relaxed at this non-counted activation seam; every intrinsic semantic
  // check (bounds containment, terrain bounds/duplicates, occupancy, quota,
  // ownership, lifecycle, and outcome) remains mandatory.
  const preservedDerivationCodes = new Set([
    "ARENA_BOUNDS_INVERTED",
    "ARENA_TERRAIN_AUTHORITY_MISMATCH",
  ])
  return result.issues.every(({ code }) => preservedDerivationCodes.has(code))
}

export const validateMachine = (
  machine: MatchMachine,
): KernelRestrictedFailure | undefined => {
  const semantic = validateCanonicalGameState(machine.state)
  if (!semantic.ok && !isPreservedV14ActivationState(machine, semantic)) {
    return integrityFailure("KERNEL_STATE_INVALID", semantic)
  }
  if (!registeredKernelTuple(machine.semanticTuple)) {
    return integrityFailure("KERNEL_SEMANTIC_TUPLE_INVALID")
  }
  if (
    machine.semanticTuple.tupleId ===
      CANDIDATE_KERNEL_V119_SEMANTIC_TUPLE_ID &&
    machine.state.initialInitiativePlayerId !== machine.state.players[0].id &&
    machine.state.initialInitiativePlayerId !== machine.state.players[1].id
  ) {
    return integrityFailure("KERNEL_INITIAL_INITIATIVE_INVALID")
  }
  if (
    !Number.isSafeInteger(machine.maxPhases) ||
    machine.maxPhases < 0 ||
    !Number.isSafeInteger(machine.phasesRun) ||
    machine.phasesRun < 0 ||
    !Number.isSafeInteger(machine.cursor.ordinal) ||
    machine.cursor.ordinal < 0 ||
    !Number.isSafeInteger(machine.cursor.cycleLayer) ||
    machine.cursor.cycleLayer < 0 ||
    !Number.isSafeInteger(machine.cursor.slotIndex) ||
    machine.cursor.slotIndex < 0
  ) {
    return integrityFailure("KERNEL_CURSOR_INVALID")
  }
  if (
    machine.cursor.phaseNumber !== machine.state.phaseNumber ||
    machine.cursor.roundNumber !== machine.state.roundNumber
  ) {
    return integrityFailure("KERNEL_CURSOR_STATE_MISMATCH")
  }
  if (
    machine.pendingEffect !== undefined &&
    (machine.pendingEffect.semanticTupleId !== machine.semanticTuple.tupleId ||
      machine.consumedRequestIds.includes(machine.pendingEffect.requestId))
  ) {
    return integrityFailure("KERNEL_PENDING_EFFECT_INVALID")
  }
  return undefined
}

export const validateKernelInput = (
  machine: MatchMachine,
  input: KernelInput,
): KernelRestrictedFailure | undefined => {
  if (input.kind === "advance") {
    return machine.pendingEffect === undefined
      ? undefined
      : integrityFailure("KERNEL_RESUME_REQUIRED")
  }
  const pending = machine.pendingEffect
  if (
    pending === undefined ||
    input.requestId !== pending.requestId ||
    input.effectKind !== pending.kind ||
    machine.consumedRequestIds.includes(input.requestId)
  ) {
    return integrityFailure("KERNEL_RESUME_IDENTITY_MISMATCH")
  }
  return undefined
}

export const safeTransitionEvents = (
  events: readonly TransitionEventSummary[],
): TransitionEventSummary[] =>
  events.map(({ type, sequence, payload, context, privacy }) => ({
    type,
    sequence,
    payload,
    ...(context === undefined ? {} : { context: { ...context } }),
    ...(privacy === undefined ? {} : { privacy }),
  }))

export const coordinatesForMachine = (
  machine: MatchMachine,
): KernelCoordinates => {
  const slot = machine.slots[machine.cursor.slotIndex]
  return {
    phaseNumber: machine.cursor.phaseNumber,
    roundNumber: machine.cursor.roundNumber,
    ...(machine.cursor.stage.startsWith("cycle") ||
    machine.cursor.stage === "soldier_effect"
      ? { cycleIndex: machine.cursor.cycleLayer }
      : {}),
    ...(slot === undefined
      ? {}
      : {
          activationId: slot.activationId,
          activationIndex: slot.activationIndex,
          actingPlayerId: slot.actingPlayerId,
          soldierId: slot.soldierId,
        }),
    stage: machine.cursor.stage,
    ordinal: machine.cursor.ordinal,
  }
}

const normalizeEffectIdentityJson = (value: unknown): JsonValue => {
  if (value === undefined) return null
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }
  if (typeof value !== "object") {
    throw new Error("KERNEL_EFFECT_IDENTITY_NON_JSON")
  }
  type Container = JsonValue[] | Record<string, JsonValue>
  const root: Container = Array.isArray(value) ? [] : {}
  const pending: Array<{ source: object; target: Container }> = [
    { source: value, target: root },
  ]
  while (pending.length > 0) {
    const current = pending.pop()!
    for (const [key, child] of Object.entries(current.source)) {
      let normalized: JsonValue
      if (child === undefined) {
        normalized = null
      } else if (
        child === null ||
        typeof child === "string" ||
        typeof child === "number" ||
        typeof child === "boolean"
      ) {
        normalized = child
      } else if (typeof child === "object") {
        const target: Container = Array.isArray(child) ? [] : {}
        normalized = target
        pending.push({ source: child, target })
      } else {
        throw new Error("KERNEL_EFFECT_IDENTITY_NON_JSON")
      }
      if (Array.isArray(current.target)) {
        current.target[Number(key)] = normalized
      } else {
        current.target[key] = normalized
      }
    }
  }
  return root
}

const privateEffectIdentityState = (state: GameState) => ({
  matchId: state.matchId,
  seed: state.seed,
  versions: {
    spec: state.versions.spec,
    engine: state.versions.engine,
    runtimeJs: state.versions.runtimeJs,
    chronicle: state.versions.chronicle,
    strategyRevision: state.versions.strategyRevision,
    arenaVariant: state.versions.arenaVariant,
  },
  arenaVariant: {
    id: state.arenaVariant.id,
    name: state.arenaVariant.name,
    initialBounds: {
      minX: state.arenaVariant.initialBounds.minX,
      maxX: state.arenaVariant.initialBounds.maxX,
      minY: state.arenaVariant.initialBounds.minY,
      maxY: state.arenaVariant.initialBounds.maxY,
    },
    terrainStones: [...state.arenaVariant.terrainStones]
      .map(({ x, y }) => ({ x, y }))
      .sort((left, right) => left.x - right.x || left.y - right.y),
  },
  players: [...state.players]
    .map((player) => ({
      id: player.id,
      side: player.side,
      strategyRevisionId: player.strategyRevisionId,
      strategyMemory: normalizeEffectIdentityJson(player.strategyMemory),
    }))
    .sort((left, right) => codePointCompare(left.id, right.id)),
  soldiers: [...state.soldiers]
    .map((soldier) => ({
      id: soldier.id,
      ownerPlayerId: soldier.ownerPlayerId,
      status: soldier.status,
      position:
        soldier.position === null
          ? null
          : { x: soldier.position.x, y: soldier.position.y },
      facing: soldier.facing ?? null,
      lastSuccessfulMoveDirection: soldier.lastSuccessfulMoveDirection ?? null,
      soldierMemory: normalizeEffectIdentityJson(soldier.soldierMemory),
    }))
    .sort((left, right) => codePointCompare(left.id, right.id)),
  phase: state.phase,
  phaseNumber: state.phaseNumber,
  roundNumber: state.roundNumber,
  activationCount: state.activationCount,
  initiativePlayerId: state.initiativePlayerId,
  bounds: {
    minX: state.bounds.minX,
    maxX: state.bounds.maxX,
    minY: state.bounds.minY,
    maxY: state.bounds.maxY,
  },
  terrainStones: [...state.terrainStones]
    .map(({ x, y }) => ({ x, y }))
    .sort((left, right) => left.x - right.x || left.y - right.y),
  outcome: state.outcome ?? null,
})

const effectEventIdentityMaterial = (
  summary: TransitionEventSummary,
): JsonValue => ({
  type: summary.type,
  sequence: summary.sequence,
  payload: normalizeEffectIdentityJson(summary.payload),
  context: normalizeEffectIdentityJson(summary.context),
  privacy: summary.privacy ?? null,
  privatePayload: normalizeEffectIdentityJson(summary.privatePayload),
})

const effectIdentityMaterial = (
  machine: MatchMachine,
  kind: KernelEffectRequest["kind"],
  suffix: string,
): JsonValue =>
  ({
    kind,
    suffix,
    executionMode: machine.executionMode,
    semanticTupleId: machine.semanticTuple.tupleId,
    state: privateEffectIdentityState(machine.state),
    initialState: privateEffectIdentityState(machine.initialState),
    cursor: {
      stage: machine.cursor.stage,
      ordinal: machine.cursor.ordinal,
      phaseNumber: machine.cursor.phaseNumber,
      roundNumber: machine.cursor.roundNumber,
      cycleLayer: machine.cursor.cycleLayer,
      slotIndex: machine.cursor.slotIndex,
    },
    maxPhases: machine.maxPhases,
    phasesRun: machine.phasesRun,
    pendingEffect: null,
    selections: {
      bottom: machine.selections.bottom.map(({ soldierId, objective }) => ({
        soldierId,
        objective: normalizeEffectIdentityJson(objective),
      })),
      top: machine.selections.top.map(({ soldierId, objective }) => ({
        soldierId,
        objective: normalizeEffectIdentityJson(objective),
      })),
    },
    slots: machine.slots.map((slot) => ({
      activationId: slot.activationId,
      activationIndex: slot.activationIndex,
      actingPlayerId: slot.actingPlayerId,
      soldierId: slot.soldierId,
      objective: normalizeEffectIdentityJson(slot.objective),
      cycleIndex: slot.cycleIndex,
      advanced: slot.advanced,
      ended: slot.ended,
      terminalReason: slot.terminalReason ?? null,
    })),
    fullEventsCommitment: fullEventHistoryCommitment(machine.fullEvents),
    fullEventsCount: machine.fullEvents.length,
    consumedRequestIdsCommitment: requestIdHistoryCommitment(
      machine.consumedRequestIds,
    ),
    consumedRequestIdsCount: machine.consumedRequestIds.length,
  }) as JsonValue

const encodeEffectIdentityReference = (material: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(material, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new Error(
      `KERNEL_EFFECT_IDENTITY_INVALID:${encoded.error.code}:${encoded.error.path.join(".")}`,
    )
  }
  return encoded.bytes
}

type Sha256Commitment = `sha256:${string}`

const FULL_EVENT_COMMITMENT_DOMAIN =
  "cowards-game:kernel-effect-full-events-commitment:v1.17" as const
const REQUEST_ID_COMMITMENT_DOMAIN =
  "cowards-game:kernel-effect-consumed-request-ids-commitment:v1.17" as const
const effectEventBytesCache = new WeakMap<object, Uint8Array>()
const fullEventCommitmentCache = new WeakMap<object, Sha256Commitment>()
const requestIdCommitmentCache = new WeakMap<object, Sha256Commitment>()

const emptyCommitment = (domain: string): Sha256Commitment =>
  `sha256:${createHash("sha256")
    .update(`${domain}\0empty`, "utf8")
    .digest("hex")}`

const extendCommitment = (
  domain: string,
  previous: Sha256Commitment,
  canonicalBytes: Uint8Array,
): Sha256Commitment =>
  `sha256:${createHash("sha256")
    .update(
      `${domain}\0step\0${previous}\0${canonicalBytes.byteLength}\0`,
      "utf8",
    )
    .update(canonicalBytes)
    .digest("hex")}`

const effectEventBytes = (summary: TransitionEventSummary): Uint8Array => {
  if (kernelOwnedEventSummaries.has(summary)) {
    const cached = effectEventBytesCache.get(summary)
    if (cached !== undefined) return cached
  }
  const bytes = encodeEffectIdentityReference(
    effectEventIdentityMaterial(summary),
  )
  if (kernelOwnedEventSummaries.has(summary)) {
    effectEventBytesCache.set(summary, bytes)
  }
  return bytes
}

const fullEventHistoryCommitment = (
  history: readonly TransitionEventSummary[],
): Sha256Commitment => {
  if (kernelOwnedEventHistories.has(history)) {
    const cached = fullEventCommitmentCache.get(history)
    if (cached !== undefined) return cached
  }
  const extension = kernelEventHistoryExtensions.get(history)
  let commitment =
    extension === undefined
      ? emptyCommitment(FULL_EVENT_COMMITMENT_DOMAIN)
      : fullEventHistoryCommitment(extension.before)
  const appended = extension?.appended ?? history
  for (const summary of appended) {
    commitment = extendCommitment(
      FULL_EVENT_COMMITMENT_DOMAIN,
      commitment,
      effectEventBytes(summary),
    )
  }
  if (kernelOwnedEventHistories.has(history)) {
    fullEventCommitmentCache.set(history, commitment)
  }
  return commitment
}

const requestIdBytes = (requestId: string): Uint8Array =>
  encodeEffectIdentityReference(requestId)

const requestIdHistoryCommitment = (
  history: readonly string[],
): Sha256Commitment => {
  if (kernelOwnedRequestIdHistories.has(history)) {
    const cached = requestIdCommitmentCache.get(history)
    if (cached !== undefined) return cached
  }
  const extension = kernelRequestIdHistoryExtensions.get(history)
  let commitment =
    extension === undefined
      ? emptyCommitment(REQUEST_ID_COMMITMENT_DOMAIN)
      : requestIdHistoryCommitment(extension.before)
  const appended = extension === undefined ? history : [extension.appended]
  for (const requestId of appended) {
    commitment = extendCommitment(
      REQUEST_ID_COMMITMENT_DOMAIN,
      commitment,
      requestIdBytes(requestId),
    )
  }
  if (kernelOwnedRequestIdHistories.has(history)) {
    requestIdCommitmentCache.set(history, commitment)
  }
  return commitment
}

export const expectedEffectRequestId = (
  machine: MatchMachine,
  kind: KernelEffectRequest["kind"],
  suffix: string,
): string => {
  if (
    machine.semanticTuple.tupleId !==
    CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID
  ) {
    return `effect:${machine.cursor.ordinal}:${machine.cursor.stage}:${kind}:${suffix}`
  }
  const encoded = encodeEffectIdentityReference(
    effectIdentityMaterial(machine, kind, suffix),
  )
  return `effect:v1.17:${createHash("sha256")
    .update(`${V117_EFFECT_REQUEST_HASH_DOMAIN}\0`, "utf8")
    .update(encoded)
    .digest("hex")}`
}
export const createTransitionRecord = (input: {
  before: MatchMachine
  after: MatchMachine
  transitionKind: string
  classification: string
  events: readonly TransitionEventSummary[]
}): KernelTransitionRecord => ({
  transitionKind: input.transitionKind,
  semanticTupleId: input.before.semanticTuple.tupleId,
  semanticTuple: projectTuple(input.before.semanticTuple.tuple),
  coordinates: coordinatesForMachine(input.before),
  classification: input.classification,
  events: safeTransitionEvents(input.events),
  beforeState: projectCanonicalStateForRecording(input.before.state),
  afterState: projectCanonicalStateForRecording(input.after.state),
  beforeStateHash: hashCanonicalState(input.before.state),
  afterStateHash: hashCanonicalState(input.after.state),
  beforeMachineHash: hashMatchMachine(input.before),
  afterMachineHash: hashMatchMachine(input.after),
  terminalStatus: input.after.state.outcome ?? null,
  failureStatus: null,
})

export const validateTransitionRecord = (
  record: KernelTransitionRecord,
  expectedTuple: KernelSemanticTuple,
): KernelRestrictedFailure | undefined => {
  if (
    !registeredKernelTuple(expectedTuple) ||
    record.semanticTupleId !== expectedTuple.tupleId ||
    JSON.stringify(record.semanticTuple) !==
      JSON.stringify(expectedTuple.tuple) ||
    !HASH_PATTERN.test(record.beforeStateHash) ||
    !HASH_PATTERN.test(record.afterStateHash) ||
    !HASH_PATTERN.test(record.beforeMachineHash) ||
    !HASH_PATTERN.test(record.afterMachineHash) ||
    record.events.length === 0 ||
    record.beforeMachineHash === record.afterMachineHash ||
    !Number.isSafeInteger(record.coordinates.phaseNumber) ||
    record.coordinates.phaseNumber < 1 ||
    !Number.isSafeInteger(record.coordinates.roundNumber) ||
    record.coordinates.roundNumber < 1 ||
    record.coordinates.roundNumber > 4 ||
    !Number.isSafeInteger(record.coordinates.ordinal) ||
    record.coordinates.ordinal < 0 ||
    record.failureStatus !== null
  ) {
    return integrityFailure("KERNEL_TRANSITION_RECORD_INVALID")
  }
  const terminalIndexes = record.events
    .map((event, index) => (event.type === "MATCH_ENDED" ? index : -1))
    .filter((index) => index >= 0)
  if (
    terminalIndexes.length > 1 ||
    (terminalIndexes.length === 1 &&
      terminalIndexes[0] !== record.events.length - 1) ||
    (record.terminalStatus !== null && terminalIndexes.length !== 1) ||
    (record.terminalStatus === null && terminalIndexes.length !== 0)
  ) {
    return integrityFailure("KERNEL_TERMINAL_EVENT_INVALID")
  }
  return undefined
}
