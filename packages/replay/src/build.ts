import {
  advanceRound,
  checkAndApplyMatchEnd,
  createInitialGameState,
  getFullBoardSnapshot,
  getInitiativeForRound,
  getOpponentPlayer,
  getRoundPlayerOrder,
  resolveActivation,
  resolveActivationSelection,
  resolveContraction,
  type GameState,
  type RunMatchInput,
  type TransitionEventSummary,
  type TransitionResult,
} from "@cowards/engine"
import {
  ROUND_ACTIVATION_COUNTS,
  type Chronicle,
  type ChronicleBoundarySnapshot,
  type ChronicleEvent,
  type ChronicleEventContext,
  type ChroniclePrivateSections,
  type ChronicleReproducibilityEnvelope,
  type ChronicleValidationError,
  type JsonValue,
  type PlayerId,
} from "@cowards/spec"

type InitialMatchInput = Omit<RunMatchInput, "runtime" | "maxPhases">

export interface BuildChronicleFromMatchResult {
  chronicle: Chronicle
  finalState: GameState
}

export type BuildChronicleFromResultResult =
  | { ok: true; chronicle: Chronicle; finalState: GameState }
  | { ok: false; errors: ChronicleValidationError[] }

export interface BuildChronicleFromResultInput {
  input: InitialMatchInput
  result: TransitionResult
}

const createReproducibility = (
  input: InitialMatchInput,
  state: GameState,
): ChronicleReproducibilityEnvelope => ({
  matchId: input.matchId,
  seed: input.seed,
  arenaVariantId: input.arenaVariant.id,
  arenaVariantVersion: state.versions.arenaVariant,
  strategyRevisionIds: [
    input.bottomStrategyRevisionId,
    input.topStrategyRevisionId,
  ],
  versions: state.versions,
})

const readObject = (value: JsonValue | undefined) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {}

const ownerFromPrivatePayload = (
  privatePayload: JsonValue | undefined,
): PlayerId | undefined => {
  const object = readObject(privatePayload)
  const ownerPlayerId = object.ownerPlayerId
  if (typeof ownerPlayerId === "string") {
    return ownerPlayerId
  }
  const playerId = object.playerId
  return typeof playerId === "string" ? playerId : undefined
}

const createPrivateRecorder = () => {
  const byPlayerId: Record<PlayerId, Record<string, JsonValue>> = {}
  const sanitize = (payload: JsonValue): JsonValue =>
    JSON.parse(JSON.stringify(payload)) as JsonValue

  return {
    record(
      ownerPlayerId: PlayerId | undefined,
      ref: string,
      payload: JsonValue | undefined,
    ): void {
      if (!ownerPlayerId || payload === undefined) {
        return
      }
      byPlayerId[ownerPlayerId] = {
        ...(byPlayerId[ownerPlayerId] ?? {}),
        [ref]: sanitize(payload),
      }
    },
    sections(debug?: JsonValue): ChroniclePrivateSections | undefined {
      const hasPrivateSections = Object.keys(byPlayerId).length > 0
      if (!hasPrivateSections && debug === undefined) {
        return undefined
      }
      return {
        byPlayerId,
        ...(debug === undefined ? {} : { debug }),
      }
    },
  }
}

const createEventAppender =
  (
    events: ChronicleEvent[],
    recorder: ReturnType<typeof createPrivateRecorder>,
  ) =>
  (
    summaries: TransitionEventSummary[],
    fallbackContext: ChronicleEventContext = {},
  ): void => {
    for (const summary of summaries) {
      const sequence = events.length
      const context = { ...fallbackContext, ...(summary.context ?? {}) }
      const privateRef =
        summary.privatePayload === undefined
          ? undefined
          : `private:event:${sequence}`
      const ownerPlayerId =
        ownerFromPrivatePayload(summary.privatePayload) ??
        context.actingPlayerId
      if (privateRef) {
        recorder.record(ownerPlayerId, privateRef, summary.privatePayload)
      }
      events.push({
        type: summary.type,
        sequence,
        context,
        privacy: summary.privacy ?? "public",
        payload: summary.payload,
        ...(privateRef === undefined ? {} : { privateRef }),
      })
    }
  }

const snapshot = (
  kind: ChronicleBoundarySnapshot["kind"],
  state: GameState,
  sequence: number,
  context: ChronicleEventContext = {},
): ChronicleBoundarySnapshot => ({
  kind,
  sequence,
  context,
  board: getFullBoardSnapshot(state),
  ...(state.outcome === undefined ? {} : { outcome: state.outcome }),
})

const currentSequence = (events: ChronicleEvent[]): number =>
  events.length === 0 ? 0 : events.length - 1

const createChronicle = (
  input: InitialMatchInput,
  finalState: GameState,
  events: ChronicleEvent[],
  snapshots: ChronicleBoundarySnapshot[],
  privateSections: ChroniclePrivateSections | undefined,
): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: createReproducibility(input, finalState),
  events,
  snapshots,
  ...(privateSections === undefined ? {} : { private: privateSections }),
})

const missingIntermediateSnapshotWarnings = (): ChronicleValidationError[] => [
  {
    code: "SNAPSHOT_MISSING",
    message:
      "Existing match result only included final state; intermediate boundary snapshots require buildChronicleFromMatch.",
  },
]

export const buildChronicleFromResult = ({
  input: _input,
  result: _result,
}: BuildChronicleFromResultInput): BuildChronicleFromResultResult => {
  return {
    ok: false,
    errors: missingIntermediateSnapshotWarnings(),
  }
}

export const buildChronicleFromMatch = (
  input: RunMatchInput,
): BuildChronicleFromMatchResult => {
  let state = createInitialGameState(input)
  const events: ChronicleEvent[] = []
  const snapshots: ChronicleBoundarySnapshot[] = [
    snapshot("MATCH_START", state, 0),
  ]
  const recorder = createPrivateRecorder()
  const appendEvents = createEventAppender(events, recorder)

  appendEvents([
    {
      type: "MATCH_STARTED",
      sequence: 0,
      payload: { matchId: state.matchId, seed: state.seed },
    },
  ])

  let phasesRun = 0
  while (!state.outcome && phasesRun < (input.maxPhases ?? 100)) {
    for (const roundNumber of [1, 2, 3, 4] as const) {
      if (state.outcome) {
        break
      }

      state = {
        ...state,
        roundNumber,
        activationCount: ROUND_ACTIVATION_COUNTS[roundNumber],
      }
      const roundContext: ChronicleEventContext = {
        phaseNumber: state.phaseNumber,
        roundNumber,
      }
      snapshots.push(
        snapshot("ROUND_START", state, events.length, roundContext),
      )
      appendEvents(
        [
          {
            type: "ROUND_STARTED",
            sequence: 0,
            payload: { roundNumber },
          },
        ],
        roundContext,
      )

      const firstPlayerId = getInitiativeForRound(state)
      const secondPlayerId = getOpponentPlayer(state, firstPlayerId).id
      const bottomSelection = resolveActivationSelection(
        state,
        input.runtime,
        state.players[0].id,
      )
      state = bottomSelection.state.state
      appendEvents(bottomSelection.events, roundContext)
      const topSelection = resolveActivationSelection(
        state,
        input.runtime,
        state.players[1].id,
      )
      state = topSelection.state.state
      appendEvents(topSelection.events, roundContext)

      const queues = new Map<string, typeof bottomSelection.state.orders>([
        [state.players[0].id, [...bottomSelection.state.orders]],
        [state.players[1].id, [...topSelection.state.orders]],
      ])
      const order = getRoundPlayerOrder(
        firstPlayerId,
        secondPlayerId,
        state.activationCount,
      )

      let activationIndex = 0
      for (const playerId of order) {
        if (state.outcome) {
          break
        }
        const activationOrder = queues.get(playerId)?.shift()
        if (!activationOrder) {
          continue
        }
        const activationContext: ChronicleEventContext = {
          ...roundContext,
          activationId: `${state.phaseNumber}:${roundNumber}:${activationIndex}`,
          activationIndex,
          actingPlayerId: playerId,
          soldierId: activationOrder.soldierId,
        }
        snapshots.push(
          snapshot("ACTIVATION_START", state, events.length, activationContext),
        )
        const resolved = resolveActivation(
          state,
          input.runtime,
          activationOrder.soldierId,
          activationOrder.objective,
        )
        state = resolved.state
        appendEvents(resolved.events, activationContext)
        snapshots.push(
          snapshot(
            "ACTIVATION_END",
            state,
            currentSequence(events),
            activationContext,
          ),
        )
        activationIndex += 1
      }

      const ended = checkAndApplyMatchEnd(state)
      state = ended.state
      appendEvents(ended.events, roundContext)
      snapshots.push(
        snapshot("ROUND_END", state, currentSequence(events), roundContext),
      )
      if (!state.outcome && roundNumber < 4) {
        state = advanceRound(state)
      }
    }

    if (!state.outcome) {
      const contraction = resolveContraction(state)
      state = contraction.state
      appendEvents(contraction.events, { phaseNumber: state.phaseNumber })
      snapshots.push(
        snapshot("CONTRACTION", state, currentSequence(events), {
          phaseNumber: state.phaseNumber,
        }),
      )
      if (!state.outcome) {
        state = advanceRound(state)
        phasesRun += 1
      }
    }
  }

  if (!state.outcome) {
    const failedOutcome = {
      type: "FAILED" as const,
      reason: "MAX_PHASES_EXCEEDED",
    }
    state = { ...state, phase: "COMPLETE", outcome: failedOutcome }
    appendEvents([
      {
        type: "MATCH_ENDED",
        sequence: 0,
        payload: failedOutcome,
      },
    ])
  }

  snapshots.push(snapshot("MATCH_END", state, currentSequence(events)))
  snapshots.push(snapshot("TERMINAL", state, currentSequence(events)))

  return {
    chronicle: createChronicle(
      input,
      state,
      events,
      snapshots,
      recorder.sections(),
    ),
    finalState: state,
  }
}
