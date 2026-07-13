import { createHash } from "node:crypto"
import type {
  GameState,
  TransitionEventSummary,
  TransitionResult,
} from "@cowards/engine"
import type {
  CanonicalCompatibilityTuple,
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleEventContext,
  ChroniclePrivateSections,
  ChronicleSchemaVersion,
  ChronicleSnapshotKind,
  FullBoardSnapshot,
  JsonValue,
  MatchOutcome,
  PlayerId,
} from "@cowards/spec"

const STATE_HASH_DOMAIN =
  "cowards-game:candidate-game-state-projection:v1" as const
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/u

interface RecorderCoordinates {
  readonly phaseNumber: number
  readonly roundNumber: 1 | 2 | 3 | 4
  readonly stage: string
  readonly ordinal: number
}

interface RecorderTransition {
  readonly transitionKind: string
  readonly semanticTupleId: string
  readonly semanticTuple: Readonly<CanonicalCompatibilityTuple>
  readonly coordinates: RecorderCoordinates
  readonly events: readonly TransitionEventSummary[]
  readonly beforeState: Readonly<Record<string, unknown>>
  readonly afterState: Readonly<Record<string, unknown>>
  readonly beforeStateHash: string
  readonly afterStateHash: string
  readonly beforeMachineHash: string
  readonly afterMachineHash: string
  readonly terminalStatus: MatchOutcome | null
  readonly failureStatus: null
}

interface CompletedRecorderExecution {
  readonly kind: "completed"
  readonly result: TransitionResult
  readonly transitions: readonly RecorderTransition[]
  readonly recorderMaterial: {
    readonly events: readonly TransitionEventSummary[]
    readonly initialState: GameState
    readonly finalState: GameState
    readonly boundaries: readonly RecorderTransition[]
  }
}

interface FailedRecorderExecution {
  readonly kind: "failure"
  readonly transitions: readonly []
  readonly failure: unknown
  readonly unchangedState: GameState
}

export type ChronicleRecorderExecution =
  | CompletedRecorderExecution
  | FailedRecorderExecution

export interface ChronicleRecordingMetadata {
  readonly schemaVersion: ChronicleSchemaVersion
  readonly semanticTupleId: string
  readonly semanticTuple: Readonly<CanonicalCompatibilityTuple>
}

export type ChronicleRecorderFailureCode =
  | "RECORDER_EXECUTION_NOT_COMPLETED"
  | "RECORDER_METADATA_INVALID"
  | "RECORDER_SEMANTIC_IDENTITY_INVALID"
  | "RECORDER_EVENT_STREAM_INVALID"
  | "RECORDER_BOUNDARY_INTEGRITY_INVALID"
  | "RECORDER_PRIVATE_OWNER_INVALID"
  | "RECORDER_MATERIAL_INVALID"

export interface ChronicleRecorderFailure {
  readonly classification: "system_failure"
  readonly ownership: "system_integrity"
  readonly code: ChronicleRecorderFailureCode
  readonly retryable: false
}

export interface ChronicleBoundaryAnchor {
  readonly kind: ChronicleSnapshotKind
  readonly snapshotIndex: number
  readonly transitionOrdinal: number
  readonly stateSide: "before" | "after"
  readonly stateHash: string
}

export type RecordChronicleFromExecutionResult =
  | {
      readonly ok: true
      readonly chronicle: Chronicle
      readonly finalState: GameState
      readonly semanticIdentity: {
        readonly tupleId: string
        readonly tuple: Readonly<CanonicalCompatibilityTuple>
      }
      readonly boundaryAnchors: readonly ChronicleBoundaryAnchor[]
    }
  | {
      readonly ok: false
      readonly failure: ChronicleRecorderFailure
    }

export interface RecordChronicleFromExecutionInput {
  readonly execution: ChronicleRecorderExecution
  readonly metadata: ChronicleRecordingMetadata
}

const failure = (
  code: ChronicleRecorderFailureCode,
): RecordChronicleFromExecutionResult => ({
  ok: false,
  failure: {
    classification: "system_failure",
    ownership: "system_integrity",
    code,
    retryable: false,
  },
})

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

const projectState = (state: GameState) => ({
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

const hashProjection = (
  projection: Readonly<Record<string, unknown>>,
): string =>
  `sha256:${createHash("sha256")
    .update(`${STATE_HASH_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(projection), "utf8")
    .digest("hex")}`

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const safeEvent = ({
  type,
  sequence,
  payload,
  context,
  privacy,
}: TransitionEventSummary) => ({
  type,
  sequence,
  payload,
  ...(context === undefined ? {} : { context }),
  ...(privacy === undefined ? {} : { privacy }),
})

const metadataIsSafe = (metadata: ChronicleRecordingMetadata): boolean =>
  same(Object.keys(metadata).sort(), [
    "schemaVersion",
    "semanticTuple",
    "semanticTupleId",
  ]) &&
  metadata.schemaVersion === "chronicle-v1.4" &&
  typeof metadata.semanticTupleId === "string" &&
  metadata.semanticTupleId.length > 0 &&
  same(Object.keys(metadata.semanticTuple).sort(), [
    "arenaCatalog",
    "chronicle",
    "engine",
    "rules",
    "runtimeAbi",
    "setPolicy",
  ])

const readObject = (
  value: JsonValue | undefined,
): Record<string, JsonValue> | undefined =>
  value !== undefined &&
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? value
    : undefined

const explicitOwner = (
  privatePayload: JsonValue | undefined,
): PlayerId | undefined => {
  const object = readObject(privatePayload)
  const owner = object?.ownerPlayerId ?? object?.playerId
  return typeof owner === "string" && owner.length > 0 ? owner : undefined
}

const cloneControlledJson = (value: JsonValue): JsonValue =>
  JSON.parse(JSON.stringify(value)) as JsonValue

const boardFromProjection = (
  projection: Readonly<Record<string, unknown>>,
): FullBoardSnapshot =>
  globalThis.structuredClone({
    bounds: projection.bounds,
    soldiers: projection.soldiers,
    terrainStones: projection.terrainStones,
  }) as FullBoardSnapshot

const outcomeFromProjection = (
  projection: Readonly<Record<string, unknown>>,
): MatchOutcome | undefined => {
  const outcome = projection.outcome
  return outcome === null || outcome === undefined
    ? undefined
    : (globalThis.structuredClone(outcome) as MatchOutcome)
}

const lastEventSequence = (transition: RecorderTransition): number =>
  transition.events.at(-1)?.sequence ?? 0

const fallbackContext = (
  transition: RecorderTransition,
): ChronicleEventContext => {
  if (
    transition.transitionKind === "MATCH_STARTED" ||
    transition.transitionKind === "MAX_PHASES_EXCEEDED"
  ) {
    return {}
  }
  if (transition.transitionKind === "CONTRACTION_RESOLVED") {
    return { phaseNumber: transition.coordinates.phaseNumber }
  }
  return {
    phaseNumber: transition.coordinates.phaseNumber,
    roundNumber: transition.coordinates.roundNumber,
  }
}

const createSnapshots = (
  transitions: readonly RecorderTransition[],
): {
  snapshots: ChronicleBoundarySnapshot[]
  anchors: ChronicleBoundaryAnchor[]
} => {
  const snapshots: ChronicleBoundarySnapshot[] = []
  const anchors: ChronicleBoundaryAnchor[] = []
  const append = (
    kind: ChronicleSnapshotKind,
    sequence: number,
    context: ChronicleEventContext,
    transition: RecorderTransition,
    stateSide: "before" | "after",
    includeOutcome = true,
  ): void => {
    const projection =
      stateSide === "before" ? transition.beforeState : transition.afterState
    const outcome = includeOutcome
      ? outcomeFromProjection(projection)
      : undefined
    snapshots.push({
      kind,
      sequence,
      context,
      board: boardFromProjection(projection),
      ...(outcome === undefined ? {} : { outcome }),
    })
    anchors.push({
      kind,
      snapshotIndex: snapshots.length - 1,
      transitionOrdinal: transition.coordinates.ordinal,
      stateSide,
      stateHash:
        stateSide === "before"
          ? transition.beforeStateHash
          : transition.afterStateHash,
    })
  }

  const first = transitions[0]!
  append("MATCH_START", 0, {}, first, "before")
  let openRound:
    | { readonly phaseNumber: number; readonly roundNumber: 1 | 2 | 3 | 4 }
    | undefined
  let previous: RecorderTransition | undefined

  const closeRound = (transition: RecorderTransition): void => {
    if (openRound === undefined) return
    append(
      "ROUND_END",
      lastEventSequence(transition),
      openRound,
      transition,
      "after",
    )
    openRound = undefined
  }

  for (const transition of transitions) {
    const roundStarted = transition.events.find(
      ({ type }) => type === "ROUND_STARTED",
    )
    if (roundStarted !== undefined) {
      if (openRound !== undefined && previous !== undefined)
        closeRound(previous)
      openRound = {
        phaseNumber: transition.coordinates.phaseNumber,
        roundNumber: transition.coordinates.roundNumber,
      }
      append(
        "ROUND_START",
        roundStarted.sequence,
        openRound,
        transition,
        "before",
      )
    }

    const contraction = transition.events.find(
      ({ type }) => type === "CONTRACTION_RESOLVED",
    )
    if (contraction !== undefined) {
      if (openRound !== undefined && previous !== undefined)
        closeRound(previous)
      append(
        "CONTRACTION",
        contraction.sequence,
        { phaseNumber: transition.coordinates.phaseNumber },
        transition,
        "after",
        false,
      )
    }
    previous = transition
  }

  const last = transitions.at(-1)!
  if (openRound !== undefined) closeRound(last)
  const terminalSequence = lastEventSequence(last)
  append("MATCH_END", terminalSequence, {}, last, "after")
  append("TERMINAL", terminalSequence, {}, last, "after")
  return { snapshots, anchors }
}

const validateExecution = (
  execution: CompletedRecorderExecution,
  metadata: ChronicleRecordingMetadata,
): ChronicleRecorderFailureCode | undefined => {
  const { transitions, recorderMaterial, result } = execution
  if (
    transitions.length === 0 ||
    recorderMaterial.boundaries.length !== transitions.length ||
    !same(recorderMaterial.boundaries, transitions) ||
    !same(result.state, recorderMaterial.finalState)
  ) {
    return "RECORDER_MATERIAL_INVALID"
  }

  const first = transitions[0]!
  if (
    first.semanticTupleId !== metadata.semanticTupleId ||
    !same(first.semanticTuple, metadata.semanticTuple) ||
    transitions.some(
      (transition) =>
        transition.semanticTupleId !== metadata.semanticTupleId ||
        !same(transition.semanticTuple, first.semanticTuple),
    )
  ) {
    return "RECORDER_SEMANTIC_IDENTITY_INVALID"
  }

  const flattened = transitions.flatMap(({ events }) => events)
  if (
    !same(flattened, result.events) ||
    !same(
      recorderMaterial.events.map(safeEvent),
      result.events.map(safeEvent),
    ) ||
    result.events.some(({ sequence }, index) => sequence !== index) ||
    result.events[0]?.type !== "MATCH_STARTED" ||
    result.events.filter(({ type }) => type === "MATCH_STARTED").length !== 1 ||
    result.events.at(-1)?.type !== "MATCH_ENDED" ||
    result.events.filter(({ type }) => type === "MATCH_ENDED").length !== 1
  ) {
    return "RECORDER_EVENT_STREAM_INVALID"
  }

  if (
    !same(first.beforeState, projectState(recorderMaterial.initialState)) ||
    !same(
      transitions.at(-1)!.afterState,
      projectState(recorderMaterial.finalState),
    )
  ) {
    return "RECORDER_MATERIAL_INVALID"
  }

  for (let index = 0; index < transitions.length; index += 1) {
    const transition = transitions[index]!
    if (
      !HASH_PATTERN.test(transition.beforeStateHash) ||
      !HASH_PATTERN.test(transition.afterStateHash) ||
      hashProjection(transition.beforeState) !== transition.beforeStateHash ||
      hashProjection(transition.afterState) !== transition.afterStateHash ||
      transition.failureStatus !== null ||
      (index > 0 &&
        (transitions[index - 1]!.afterStateHash !==
          transition.beforeStateHash ||
          !same(transitions[index - 1]!.afterState, transition.beforeState)))
    ) {
      return "RECORDER_BOUNDARY_INTEGRITY_INVALID"
    }
  }

  for (const summary of recorderMaterial.events) {
    if (
      summary.privatePayload !== undefined &&
      explicitOwner(summary.privatePayload) === undefined
    ) {
      return "RECORDER_PRIVATE_OWNER_INVALID"
    }
  }
  return undefined
}

export const recordChronicleFromExecution = ({
  execution,
  metadata,
}: RecordChronicleFromExecutionInput): RecordChronicleFromExecutionResult => {
  if (execution.kind !== "completed") {
    return failure("RECORDER_EXECUTION_NOT_COMPLETED")
  }
  if (!metadataIsSafe(metadata)) return failure("RECORDER_METADATA_INVALID")
  const invalid = validateExecution(execution, metadata)
  if (invalid !== undefined) return failure(invalid)

  const events: ChronicleEvent[] = []
  const byPlayerId: Record<PlayerId, Record<string, JsonValue>> = {}
  const transitionBySequence = new Map(
    execution.transitions.flatMap((transition) =>
      transition.events.map((event) => [event.sequence, transition] as const),
    ),
  )
  for (const summary of execution.recorderMaterial.events) {
    const transition = transitionBySequence.get(summary.sequence)!
    const privateRef =
      summary.privatePayload === undefined
        ? undefined
        : `private:event:${summary.sequence}`
    if (privateRef !== undefined) {
      const owner = explicitOwner(summary.privatePayload)!
      byPlayerId[owner] = {
        ...(byPlayerId[owner] ?? {}),
        [privateRef]: cloneControlledJson(summary.privatePayload!),
      }
    }
    events.push({
      type: summary.type,
      sequence: summary.sequence,
      context: {
        ...fallbackContext(transition),
        ...(summary.context ?? {}),
      },
      privacy: summary.privacy ?? "public",
      payload: cloneControlledJson(summary.payload),
      ...(privateRef === undefined ? {} : { privateRef }),
    })
  }

  const finalState = execution.recorderMaterial.finalState
  const { snapshots, anchors } = createSnapshots(execution.transitions)
  const privateSections: ChroniclePrivateSections | undefined =
    Object.keys(byPlayerId).length === 0 ? undefined : { byPlayerId }
  const chronicle: Chronicle = {
    schemaVersion: metadata.schemaVersion,
    reproducibility: {
      matchId: finalState.matchId,
      seed: finalState.seed,
      arenaVariantId: finalState.arenaVariant.id,
      arenaVariantVersion: finalState.versions.arenaVariant,
      strategyRevisionIds: [
        finalState.players[0].strategyRevisionId,
        finalState.players[1].strategyRevisionId,
      ],
      versions: globalThis.structuredClone(finalState.versions),
    },
    events,
    snapshots,
    ...(privateSections === undefined ? {} : { private: privateSections }),
  }
  const first = execution.transitions[0]!
  return {
    ok: true,
    chronicle,
    finalState,
    semanticIdentity: {
      tupleId: first.semanticTupleId,
      tuple: globalThis.structuredClone(first.semanticTuple),
    },
    boundaryAnchors: anchors,
  }
}
