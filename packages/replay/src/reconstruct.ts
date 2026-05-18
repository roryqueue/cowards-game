import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationError,
} from "@cowards/spec"
import {
  applyReplayEvent,
  compareReplayStateToSnapshot,
  stateFromSnapshot,
  type ReplayState,
  type ReplayStateResult,
} from "./replay-transition.js"
import { validateChronicle } from "./validate.js"

export interface ReplayTimelineEntry {
  sequence: number
  event: ChronicleEvent
  state: ReplayState
}

export interface Replay {
  stateAt(sequence: number): ReplayStateResult
  iterateReplay(): IterableIterator<ReplayTimelineEntry>
}

export type CreateReplayResult =
  | { ok: true; replay: Replay }
  | { ok: false; errors: ChronicleValidationError[] }

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})

const nearestSnapshotAtOrBefore = (
  chronicle: Chronicle,
  sequence: number,
): ChronicleBoundarySnapshot | undefined =>
  [...chronicle.snapshots]
    .filter((snapshot) => snapshot.sequence <= sequence)
    .sort((left, right) => right.sequence - left.sequence)[0]

const snapshotAt = (
  chronicle: Chronicle,
  sequence: number,
): ChronicleBoundarySnapshot | undefined =>
  chronicle.snapshots.find((snapshot) => snapshot.sequence === sequence)

const createStateAt =
  (chronicle: Chronicle) =>
  (sequence: number): ReplayStateResult => {
    if (!Number.isInteger(sequence) || sequence < 0) {
      return {
        ok: false,
        errors: [
          error(
            "EVENT_ORDER_INVALID",
            "Replay sequence must be a nonnegative integer.",
            {
              actual: sequence,
            },
          ),
        ],
      }
    }
    const event = chronicle.events[sequence]
    if (!event) {
      return {
        ok: false,
        errors: [
          error("EVENT_ORDER_INVALID", "Replay sequence does not exist.", {
            actual: sequence,
          }),
        ],
      }
    }
    const startingSnapshot = nearestSnapshotAtOrBefore(chronicle, sequence)
    if (!startingSnapshot) {
      return {
        ok: false,
        errors: [
          error(
            "SNAPSHOT_MISSING",
            "No boundary snapshot exists before sequence.",
            {
              sequence,
            },
          ),
        ],
      }
    }
    let current = stateFromSnapshot(startingSnapshot)
    for (
      let eventIndex = startingSnapshot.sequence + 1;
      eventIndex <= sequence;
      eventIndex += 1
    ) {
      const eventToApply = chronicle.events[eventIndex]
      if (!eventToApply) {
        return {
          ok: false,
          errors: [
            error(
              "EVENT_ORDER_INVALID",
              "Replay event sequence does not exist.",
              {
                actual: eventIndex,
              },
            ),
          ],
        }
      }
      const result = applyReplayEvent(current, eventToApply)
      if (!result.ok) {
        return result
      }
      current = result.state
      const boundary = snapshotAt(chronicle, eventIndex)
      if (boundary) {
        const snapshotErrors = compareReplayStateToSnapshot(current, boundary)
        if (snapshotErrors.length > 0) {
          return { ok: false, errors: snapshotErrors }
        }
      }
    }
    return { ok: true, state: current }
  }

export const createReplay = (chronicle: Chronicle): CreateReplayResult => {
  const validation = validateChronicle(chronicle)
  if (!validation.ok) {
    return validation
  }
  const stateAt = createStateAt(chronicle)
  return {
    ok: true,
    replay: {
      stateAt,
      *iterateReplay() {
        for (const event of chronicle.events) {
          const result = stateAt(event.sequence)
          if (!result.ok) {
            return
          }
          yield { sequence: event.sequence, event, state: result.state }
        }
      },
    },
  }
}
