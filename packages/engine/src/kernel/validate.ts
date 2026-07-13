import { createHash } from "node:crypto"
import {
  projectRestrictedSemanticIntegrityFailure,
  validateCanonicalGameState,
  type CanonicalCompatibilityTuple,
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
} from "./types.js"

const MACHINE_HASH_DOMAIN =
  "cowards-game:candidate-match-machine-projection:v1" as const
const STATE_HASH_DOMAIN =
  "cowards-game:candidate-game-state-projection:v1" as const
const RECORDER_HASH_DOMAIN =
  "cowards-game:candidate-recorder-material:v1" as const
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/u

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
  consumedRequestIds: [...machine.consumedRequestIds].sort(codePointCompare),
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
        semanticTupleId: CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID,
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

export const validateMachine = (
  machine: MatchMachine,
): KernelRestrictedFailure | undefined => {
  const semantic = validateCanonicalGameState(machine.state)
  if (!semantic.ok) return integrityFailure("KERNEL_STATE_INVALID", semantic)
  if (
    machine.semanticTuple.tupleId !== CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID ||
    JSON.stringify(projectTuple(machine.semanticTuple.tuple)) !==
      JSON.stringify(CANDIDATE_KERNEL_SEMANTIC_TUPLE)
  ) {
    return integrityFailure("KERNEL_SEMANTIC_TUPLE_INVALID")
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

export const expectedEffectRequestId = (
  machine: MatchMachine,
  kind: KernelEffectRequest["kind"],
  suffix: string,
): string =>
  `effect:${machine.cursor.ordinal}:${machine.cursor.stage}:${kind}:${suffix}`

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
    expectedTuple.tupleId !== CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID ||
    JSON.stringify(projectTuple(expectedTuple.tuple)) !==
      JSON.stringify(CANDIDATE_KERNEL_SEMANTIC_TUPLE) ||
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
