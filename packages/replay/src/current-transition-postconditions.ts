import type {
  ChronicleEvent,
  ChronicleEventContext,
  FullBoardSnapshot,
  JsonValue,
  MatchOutcome,
} from "@cowards/spec"
import { stableStringify } from "./hash.js"
import { applyReplayEvent, type ReplayState } from "./replay-transition.js"

interface CurrentRecordedEventSummary {
  readonly type: ChronicleEvent["type"]
  readonly sequence: number
  readonly payload: JsonValue
  readonly context?: ChronicleEventContext | undefined
  readonly privacy?: ChronicleEvent["privacy"] | undefined
}

interface CurrentRecordedTransitionPostcondition {
  readonly beforeState: object
  readonly afterState: object
  readonly events: readonly CurrentRecordedEventSummary[]
  readonly terminalStatus: MatchOutcome | null
}

export interface CurrentTransitionPostconditionInput {
  readonly transitions: readonly CurrentRecordedTransitionPostcondition[]
  readonly finalOutcome: MatchOutcome | undefined
}

export type CurrentTransitionPostconditionResult =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly code:
        | "CURRENT_RECONSTRUCTION_SHAPE_INVALID"
        | "CURRENT_TRANSITION_STATE_MISMATCH"
        | "CURRENT_TERMINAL_STATE_MISMATCH"
      readonly transitionIndex?: number | undefined
    }

export const replayStateFromCurrentProjection = (
  projection: object,
): ReplayState | undefined => {
  const fields = projection as Readonly<Record<string, unknown>>
  if (
    fields.bounds === undefined ||
    !Array.isArray(fields.soldiers) ||
    !Array.isArray(fields.terrainStones)
  ) {
    return undefined
  }
  return {
    board: globalThis.structuredClone({
      bounds: fields.bounds,
      soldiers: fields.soldiers,
      terrainStones: fields.terrainStones,
    }) as FullBoardSnapshot,
    ...(fields.outcome === null || fields.outcome === undefined
      ? {}
      : {
          outcome: globalThis.structuredClone(fields.outcome) as MatchOutcome,
        }),
  }
}

export const validateCurrentTransitionPostconditions = ({
  transitions,
  finalOutcome,
}: CurrentTransitionPostconditionInput): CurrentTransitionPostconditionResult => {
  for (let index = 0; index < transitions.length; index += 1) {
    const transition = transitions[index]!
    const before = replayStateFromCurrentProjection(transition.beforeState)
    const expectedAfter = replayStateFromCurrentProjection(
      transition.afterState,
    )
    if (before === undefined || expectedAfter === undefined) {
      return {
        ok: false,
        code: "CURRENT_RECONSTRUCTION_SHAPE_INVALID",
        transitionIndex: index,
      }
    }
    let reconstructed = before
    for (const summary of transition.events) {
      const applied = applyReplayEvent(reconstructed, {
        type: summary.type,
        sequence: summary.sequence,
        context: summary.context ?? {},
        privacy: summary.privacy ?? "public",
        payload: summary.payload,
      })
      if (!applied.ok) {
        return {
          ok: false,
          code: "CURRENT_TRANSITION_STATE_MISMATCH",
          transitionIndex: index,
        }
      }
      reconstructed = applied.state
    }
    if (stableStringify(reconstructed) !== stableStringify(expectedAfter)) {
      return {
        ok: false,
        code: "CURRENT_TRANSITION_STATE_MISMATCH",
        transitionIndex: index,
      }
    }
  }

  const terminalEvents = transitions.flatMap((transition) =>
    transition.events.filter(({ type }) => type === "MATCH_ENDED"),
  )
  const terminalStatuses = transitions.filter(
    ({ terminalStatus }) => terminalStatus !== null,
  )
  if (
    finalOutcome === undefined &&
    terminalEvents.length === 0 &&
    terminalStatuses.length === 0
  ) {
    return { ok: true }
  }
  const last = transitions.at(-1)
  const terminalEvent = last?.events.at(-1)
  if (
    finalOutcome === undefined ||
    last === undefined ||
    terminalEvents.length !== 1 ||
    terminalEvent?.type !== "MATCH_ENDED" ||
    stableStringify(terminalEvent.payload) !== stableStringify(finalOutcome) ||
    stableStringify(last.terminalStatus) !== stableStringify(finalOutcome)
  ) {
    return { ok: false, code: "CURRENT_TERMINAL_STATE_MISMATCH" }
  }
  return { ok: true }
}
