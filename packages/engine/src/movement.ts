import type { Action, Direction, Soldier } from "@cowards/spec"
import { resolveBackstabBoundary } from "./backstab.js"
import {
  getOccupyingSoldier,
  getSoldier,
  getTerrainStoneAt,
  isWithinBounds,
  movePosition,
  oppositeDirection,
  replaceSoldier,
  replaceSoldiers,
} from "./selectors.js"
import {
  event,
  type ActionResolution,
  type ActivationContext,
  type GameState,
} from "./types.js"

export { directionDelta, movePosition, oppositeDirection } from "./selectors.js"

const noChange = (state: GameState): ActionResolution => ({
  state,
  events: [],
  advanced: false,
})

const withPostAdvanceBackstab = (
  resolution: ActionResolution,
): ActionResolution => {
  if (!resolution.advanced) {
    return resolution
  }
  const backstab = resolveBackstabBoundary(resolution.state, "post-advance")
  return {
    ...resolution,
    state: backstab.state,
    events: [...resolution.events, ...backstab.events],
  }
}

const getActiveMover = (
  state: GameState,
  soldierId: string,
): Soldier | undefined => {
  const soldier = getSoldier(state, soldierId)
  return soldier?.status === "ACTIVE" ? soldier : undefined
}

export const resolveTurn = (
  state: GameState,
  soldierId: string,
  direction: Direction,
): ActionResolution => {
  const soldier = getActiveMover(state, soldierId)
  if (!soldier) {
    return noChange(state)
  }
  return {
    state: replaceSoldier(state, { ...soldier, facing: direction }),
    events: [event("TURN_RESOLVED", { soldierId, direction })],
    advanced: false,
  }
}

export const resolveTurnToStone = (
  state: GameState,
  soldierId: string,
): ActionResolution => {
  const soldier = getActiveMover(state, soldierId)
  if (!soldier) {
    return noChange(state)
  }
  return {
    state: replaceSoldier(state, { ...soldier, status: "STONE" }),
    events: [event("SOLDIER_STONED", { soldierId, reason: "TURN_TO_STONE" })],
    advanced: false,
    terminalReason: "SOLDIER_STONED",
  }
}

const resolveActiveCollision = (
  state: GameState,
  mover: Soldier,
  target: Soldier,
  direction: Direction,
): ActionResolution => {
  if (target.facing === oppositeDirection(direction)) {
    return {
      state,
      events: [
        event("MOVE_BLOCKED", {
          soldierId: mover.id,
          reason: "HEAD_TO_HEAD",
          targetSoldierId: target.id,
        }),
      ],
      advanced: false,
      terminalReason: "MOVE_BLOCKED",
    }
  }

  if (target.facing === direction) {
    return {
      state,
      events: [
        event("MOVE_BLOCKED", {
          soldierId: mover.id,
          reason: "ACTIVE_SOLDIER",
          targetSoldierId: target.id,
        }),
      ],
      advanced: false,
      terminalReason: "MOVE_BLOCKED",
    }
  }

  if (target.position === null || mover.position === null) {
    return noChange(state)
  }
  const pushDestination = movePosition(target.position, direction)
  const occupied = getOccupyingSoldier(state, pushDestination)
  const terrainStone = getTerrainStoneAt(state, pushDestination)
  if (occupied || terrainStone) {
    return {
      state,
      events: [
        event("PUSH_BLOCKED", {
          soldierId: mover.id,
          targetSoldierId: target.id,
        }),
      ],
      advanced: false,
      terminalReason: "MOVE_BLOCKED",
    }
  }

  const pushedSoldier = isWithinBounds(pushDestination, state.bounds)
    ? { ...target, position: pushDestination }
    : {
        ...target,
        status: "FALLEN" as const,
        position: null,
      }
  const advancedMover = {
    ...mover,
    position: target.position,
    facing: direction,
    lastSuccessfulMoveDirection: direction,
  }
  return withPostAdvanceBackstab({
    state: replaceSoldiers(state, [pushedSoldier, advancedMover]),
    events: [
      event("PUSH_RESOLVED", {
        soldierId: mover.id,
        targetSoldierId: target.id,
        pushedOffBoard: pushedSoldier.status === "FALLEN",
      }),
      ...(pushedSoldier.status === "FALLEN"
        ? [
            event("SOLDIER_FELL", {
              soldierId: pushedSoldier.id,
              reason: "PUSHED_OFF_BOARD",
            }),
          ]
        : []),
      event("MOVE_ADVANCED", { soldierId: mover.id, direction }),
    ],
    advanced: true,
  })
}

export const resolveMove = (
  state: GameState,
  soldierId: string,
  direction: Direction,
): ActionResolution => {
  const mover = getActiveMover(state, soldierId)
  if (!mover || mover.position === null) {
    return noChange(state)
  }
  if (mover.lastSuccessfulMoveDirection === oppositeDirection(direction)) {
    return {
      state,
      events: [
        event("MOVE_BLOCKED", {
          soldierId,
          reason: "IMMEDIATE_REVERSAL",
        }),
      ],
      advanced: false,
      terminalReason: "INVALID_MOVE",
    }
  }

  const destination = movePosition(mover.position, direction)
  if (!isWithinBounds(destination, state.bounds)) {
    return {
      state: replaceSoldier(state, {
        ...mover,
        status: "FALLEN",
        position: null,
      }),
      events: [event("SOLDIER_FELL", { soldierId, reason: "MOVED_OFF_BOARD" })],
      advanced: false,
      terminalReason: "SOLDIER_FELL",
    }
  }
  if (getTerrainStoneAt(state, destination)) {
    return {
      state,
      events: [event("MOVE_BLOCKED", { soldierId, reason: "TERRAIN_STONE" })],
      advanced: false,
      terminalReason: "MOVE_BLOCKED",
    }
  }
  const occupant = getOccupyingSoldier(state, destination)
  if (!occupant) {
    return withPostAdvanceBackstab({
      state: replaceSoldier(state, {
        ...mover,
        position: destination,
        facing: direction,
        lastSuccessfulMoveDirection: direction,
      }),
      events: [event("MOVE_ADVANCED", { soldierId, direction })],
      advanced: true,
    })
  }
  if (occupant.status === "STONE") {
    return {
      state,
      events: [event("MOVE_BLOCKED", { soldierId, reason: "STONE_SOLDIER" })],
      advanced: false,
      terminalReason: "MOVE_BLOCKED",
    }
  }
  return resolveActiveCollision(state, mover, occupant, direction)
}

export const resolveAction = (
  state: GameState,
  soldierId: string,
  action: Action,
  _activationContext: ActivationContext,
): ActionResolution => {
  switch (action.type) {
    case "TURN":
      return resolveTurn(state, soldierId, action.direction)
    case "TURN_TO_STONE":
      return resolveTurnToStone(state, soldierId)
    case "MOVE":
      return resolveMove(state, soldierId, action.direction)
  }
  const exhaustive: never = action
  return exhaustive
}
