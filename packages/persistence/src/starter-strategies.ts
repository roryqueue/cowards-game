import {
  buildStrategyRevision,
  validateStrategySource,
  type StrategyRevisionValidationReport,
} from "@cowards/runtime-js"
import type { StrategyRevision } from "@cowards/spec"

export type StarterStrategyId =
  | "starter:centerline-bully"
  | "starter:corner-lurker"
  | "starter:backstab-hunter"
  | "starter:wall-press"
  | "starter:ring-runner"
  | "starter:mirror-breaker"
  | "starter:center-turtle"
  | "starter:aggro-chaser"
  | "starter:escape-artist"
  | "starter:trap-setter"

export interface StarterStrategyDefinition {
  id: StarterStrategyId
  name: string
  version: "v1"
  description: string
  tags: string[]
  doctrineNotes: string[]
  expectedBehavior: string
  usesMemory: boolean
  source: string
}

export interface StarterStrategySummary extends StarterStrategyDefinition {
  validation: StrategyRevisionValidationReport
  sourceHash: string
  sourceBytes: number
}

const centerlineBullySource = `
// Doctrine: claim central lanes, face nearby enemies, and keep pressure off the edge.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]

const step = (position, direction) => {
  if (!position) return null
  if (direction === "UP") return { x: position.x, y: position.y - 1 }
  if (direction === "RIGHT") return { x: position.x + 1, y: position.y }
  if (direction === "DOWN") return { x: position.x, y: position.y + 1 }
  return { x: position.x - 1, y: position.y }
}

const inside = (position, bounds) =>
  position &&
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

const distanceFromCenter = (position, bounds) => {
  if (!position) return 99
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return Math.abs(position.x - centerX) + Math.abs(position.y - centerY)
}

const nearestEnemyDirection = (self, enemies) => {
  const live = enemies.filter((soldier) => soldier.status === "ACTIVE" && soldier.position)
  live.sort((left, right) =>
    Math.abs(left.position.x - self.position.x) + Math.abs(left.position.y - self.position.y) -
    (Math.abs(right.position.x - self.position.x) + Math.abs(right.position.y - self.position.y))
  )
  const target = live[0]
  if (!target || !self.position) return self.facing ?? "UP"
  const dx = target.position.x - self.position.x
  const dy = target.position.y - self.position.y
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "DOWN" : "UP")
}

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const wallEscapeScore = (grid, direction) =>
  grid.cells.reduce((score, cell) => {
    if (cell.contents !== "WALL") return score
    if (cell.dx < 0 && direction === "RIGHT") return score + 4
    if (cell.dx > 0 && direction === "LEFT") return score + 4
    if (cell.dy < 0 && direction === "DOWN") return score + 4
    if (cell.dy > 0 && direction === "UP") return score + 4
    return score
  }, 0)

const openMoveDirection = (input, preferred) => {
  const ranked = directions
    .map((direction) => {
      const cell = cellFor(input.awarenessGrid, direction)
      if (cell?.contents !== "EMPTY") return [direction, -999]
      if (input.self.lastSuccessfulMoveDirection === reverse[direction]) return [direction, -998]
      return [direction, (direction === preferred ? 6 : 0) + wallEscapeScore(input.awarenessGrid, direction)]
    })
    .sort((left, right) => right[1] - left[1])
  return ranked[0]?.[1] > -900 ? ranked[0][0] : null
}

const bestCenterDirection = (self, board) => {
  let best = self.facing ?? "UP"
  let bestScore = 999
  for (const direction of directions) {
    const next = step(self.position, direction)
    if (!inside(next, board.bounds)) continue
    const score = distanceFromCenter(next, board.bounds)
    if (score < bestScore) {
      best = direction
      bestScore = score
    }
  }
  return best
}

export default {
  selectActivations(input) {
    const ordered = input.mySoldiers
      .filter((soldier) => soldier.status === "ACTIVE")
      .sort((left, right) => distanceFromCenter(left.position, input.board.bounds) - distanceFromCenter(right.position, input.board.bounds))
      .slice(0, input.activationCount)
      .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "centerline", target: nearestEnemyDirection(soldier, input.enemySoldiers) } }))
    return { activationOrders: ordered, strategyMemory: input.strategyMemory }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const desired = input.objective?.target ?? bestCenterDirection(input.self, { bounds: { minX: -4, maxX: 4, minY: -4, maxY: 4 } })
    const direction = openMoveDirection(input, desired)
    const front = cellFor(input.awarenessGrid, desired)
    const action = direction
      ? { type: "MOVE", direction }
      : front?.contents === "ENEMY_ACTIVE"
        ? { type: "MOVE", direction: desired }
        : { type: "TURN", direction: desired }
    return { action, soldierMemory: input.soldierMemory }
  }
}
`.trim()

const cornerLurkerSource = `
// Doctrine: survive near corners, wait for overextension, and turn to stone when crowded.
const cornerDirections = ["UP", "LEFT", "DOWN", "RIGHT"]

const adjacentEnemy = (grid) =>
  grid.cells.some((cell) =>
    cell.contents === "ENEMY_ACTIVE" &&
    ((cell.dx === 0 && Math.abs(cell.dy) === 1) || (cell.dy === 0 && Math.abs(cell.dx) === 1))
  )

const wallCount = (grid) =>
  grid.cells.filter((cell) => Math.abs(cell.dx) + Math.abs(cell.dy) === 1 && cell.contents === "WALL").length

const openDirection = (grid, fallback) => {
  const cells = [
    ["UP", grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)],
    ["RIGHT", grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)],
    ["DOWN", grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)],
    ["LEFT", grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)]
  ]
  const open = cells.find((entry) => entry[1]?.contents === "EMPTY")
  return open?.[0] ?? fallback
}

const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const mobileDirection = (input, fallback) => {
  const candidates = ["UP", "RIGHT", "DOWN", "LEFT"]
    .map((direction) => {
      const cell = input.awarenessGrid.cells.find((candidate) =>
        direction === "UP" ? candidate.dx === 0 && candidate.dy === -1 :
        direction === "RIGHT" ? candidate.dx === 1 && candidate.dy === 0 :
        direction === "DOWN" ? candidate.dx === 0 && candidate.dy === 1 :
        candidate.dx === -1 && candidate.dy === 0
      )
      if (cell?.contents !== "EMPTY") return [direction, -999]
      if (input.self.lastSuccessfulMoveDirection === reverse[direction]) return [direction, -998]
      const wallEscape = input.awarenessGrid.cells.reduce((score, nearby) => {
        if (nearby.contents !== "WALL") return score
        if (nearby.dx < 0 && direction === "RIGHT") return score + 4
        if (nearby.dx > 0 && direction === "LEFT") return score + 4
        if (nearby.dy < 0 && direction === "DOWN") return score + 4
        if (nearby.dy > 0 && direction === "UP") return score + 4
        return score
      }, 0)
      return [direction, wallEscape + (direction === fallback ? 2 : 0)]
    })
    .sort((left, right) => right[1] - left[1])
  return candidates[0]?.[1] > -900 ? candidates[0][0] : null
}

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice()
        .reverse()
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "corner-lurk" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const facing = input.self.facing ?? cornerDirections[input.cycleIndex % cornerDirections.length]
    const direction = mobileDirection(input, openDirection(input.awarenessGrid, facing))
    if (!direction && adjacentEnemy(input.awarenessGrid) && wallCount(input.awarenessGrid) >= 1) {
      return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory }
    }
    return {
      action: direction ? { type: "MOVE", direction } : { type: "TURN", direction: facing },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const backstabHunterSource = `
// Doctrine: approach from exposed rear arcs and remember the last promising chase lane.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]
const opposite = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const rearTarget = (grid) => {
  const candidates = grid.cells.filter((cell) => cell.contents === "ENEMY_ACTIVE" && cell.facing)
  const rear = candidates.find((cell) => {
    if (cell.facing === "UP") return cell.dy === -1 && cell.dx === 0
    if (cell.facing === "DOWN") return cell.dy === 1 && cell.dx === 0
    if (cell.facing === "LEFT") return cell.dx === -1 && cell.dy === 0
    return cell.dx === 1 && cell.dy === 0
  })
  return rear ?? candidates.sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - (Math.abs(right.dx) + Math.abs(right.dy)))[0]
}

const directionTo = (cell, fallback) => {
  if (!cell) return fallback
  if (Math.abs(cell.dx) > Math.abs(cell.dy)) return cell.dx > 0 ? "RIGHT" : "LEFT"
  if (cell.dy !== 0) return cell.dy > 0 ? "DOWN" : "UP"
  return fallback
}

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const openLane = (input, preferred) => {
  const ranked = directions
    .map((direction) => {
      const cell = cellFor(input.awarenessGrid, direction)
      if (cell?.contents !== "EMPTY") return [direction, -999]
      if (input.self.lastSuccessfulMoveDirection === opposite[direction]) return [direction, -998]
      return [direction, direction === preferred ? 5 : 1]
    })
    .sort((left, right) => right[1] - left[1])
  return ranked[0]?.[1] > -900 ? ranked[0][0] : null
}

export default {
  selectActivations(input) {
    const memory = input.strategyMemory && typeof input.strategyMemory === "object" ? input.strategyMemory : {}
    const active = input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE")
    return {
      activationOrders: active.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "backstab", lastLane: memory.lastLane ?? null } })),
      strategyMemory: { ...memory, lastSelected: active.map((soldier) => soldier.id).slice(0, input.activationCount) }
    }
  },
  soldierBrain(input) {
    const memory = input.soldierMemory && typeof input.soldierMemory === "object" ? input.soldierMemory : {}
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: opposite[input.self.lastSuccessfulMoveDirection] }, soldierMemory: memory }
    }
    const target = rearTarget(input.awarenessGrid)
    const lane = directionTo(target, memory.lastLane ?? input.self.facing ?? "UP")
    const close = target && Math.abs(target.dx) + Math.abs(target.dy) === 1
    const open = openLane(input, lane)
    return {
      action: close || open ? { type: "MOVE", direction: close ? lane : open } : { type: "TURN", direction: lane },
      soldierMemory: { ...memory, lastLane: lane, rearSeen: Boolean(target?.facing) }
    }
  }
}
`.trim()

const wallPressSource = `
// Doctrine: use board edges as pressure tools and shove enemies toward unsafe lanes.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]

const nearestEnemy = (grid) =>
  grid.cells
    .filter((cell) => cell.contents === "ENEMY_ACTIVE")
    .sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - (Math.abs(right.dx) + Math.abs(right.dy)))[0]

const toward = (cell, fallback) => {
  if (!cell) return fallback
  if (Math.abs(cell.dx) > Math.abs(cell.dy)) return cell.dx > 0 ? "RIGHT" : "LEFT"
  if (cell.dy !== 0) return cell.dy > 0 ? "DOWN" : "UP"
  return fallback
}

const wallSide = (grid) => {
  const walls = grid.cells.filter((cell) => cell.contents === "WALL")
  const top = walls.filter((cell) => cell.dy < 0).length
  const right = walls.filter((cell) => cell.dx > 0).length
  const bottom = walls.filter((cell) => cell.dy > 0).length
  const left = walls.filter((cell) => cell.dx < 0).length
  const scores = [["UP", top], ["RIGHT", right], ["DOWN", bottom], ["LEFT", left]]
  scores.sort((a, b) => b[1] - a[1])
  return scores[0][0]
}

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const oppositeWallEscape = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }
const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const bestMove = (input, preferred) => {
  const wall = wallSide(input.awarenessGrid)
  const away = oppositeWallEscape[wall] ?? preferred
  const ranked = directions
    .map((direction) => {
      const cell = cellFor(input.awarenessGrid, direction)
      if (cell?.contents !== "EMPTY") return [direction, -999]
      if (input.self.lastSuccessfulMoveDirection === reverse[direction]) return [direction, -998]
      return [direction, (direction === preferred ? 4 : 0) + (direction === away ? 5 : 0)]
    })
    .sort((left, right) => right[1] - left[1])
  return ranked[0]?.[1] > -900 ? ranked[0][0] : null
}

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "wall-press" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const enemy = nearestEnemy(input.awarenessGrid)
    const pressure = toward(enemy, input.self.facing ?? "UP")
    const move = bestMove(input, pressure)
    if (move) return { action: { type: "MOVE", direction: move }, soldierMemory: input.soldierMemory }
    return { action: { type: "TURN", direction: enemy ? pressure : wallSide(input.awarenessGrid) }, soldierMemory: input.soldierMemory }
  }
}
`.trim()

const ringRunnerSource = `
// Doctrine: orbit the shrinking ring while remembering a clockwise or counter-clockwise lane.
const clockwise = ["UP", "RIGHT", "DOWN", "LEFT"]
const counter = ["UP", "LEFT", "DOWN", "RIGHT"]

const nextDirection = (current, turn) => {
  const ring = turn === "counter" ? counter : clockwise
  const index = ring.indexOf(current)
  return ring[(index < 0 ? 1 : index + 1) % ring.length]
}

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const openDirection = (input, preferred) => {
  const ranked = clockwise
    .map((direction) => {
      const cell = cellFor(input.awarenessGrid, direction)
      if (cell?.contents !== "EMPTY") return [direction, -999]
      if (input.self.lastSuccessfulMoveDirection === reverse[direction]) return [direction, -998]
      return [direction, direction === preferred ? 4 : 1]
    })
    .sort((left, right) => right[1] - left[1])
  return ranked[0]?.[1] > -900 ? ranked[0][0] : null
}

export default {
  selectActivations(input) {
    const memory = input.strategyMemory && typeof input.strategyMemory === "object" ? input.strategyMemory : {}
    const turn = memory.turn === "counter" ? "counter" : "clockwise"
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "ring-runner", turn } })),
      strategyMemory: { ...memory, turn, rounds: (memory.rounds ?? 0) + 1 }
    }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const turn = input.objective?.turn === "counter" ? "counter" : "clockwise"
    const facing = input.self.facing ?? "UP"
    const forward = cellFor(input.awarenessGrid, facing)
    if (forward?.contents === "EMPTY" && input.self.lastSuccessfulMoveDirection !== reverse[facing]) {
      return { action: { type: "MOVE", direction: facing }, soldierMemory: { turn, last: facing } }
    }
    const direction = nextDirection(facing, turn)
    const open = openDirection(input, direction)
    return { action: open ? { type: "MOVE", direction: open } : { type: "TURN", direction }, soldierMemory: { turn, last: open ?? direction } }
  }
}
`.trim()

const mirrorBreakerSource = `
// Doctrine: mirror early board pressure, then break symmetry when contraction or contact appears.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]
const opposite = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const enemyVector = (self, enemies) => {
  const live = enemies.filter((soldier) => soldier.status === "ACTIVE" && soldier.position && self.position)
  live.sort((left, right) =>
    Math.abs(left.position.x - self.position.x) + Math.abs(left.position.y - self.position.y) -
    (Math.abs(right.position.x - self.position.x) + Math.abs(right.position.y - self.position.y))
  )
  const target = live[0]
  if (!target || !self.position) return null
  return { dx: target.position.x - self.position.x, dy: target.position.y - self.position.y }
}

const directionFromVector = (vector, fallback) => {
  if (!vector) return fallback
  if (Math.abs(vector.dx) > Math.abs(vector.dy)) return vector.dx > 0 ? "RIGHT" : "LEFT"
  if (vector.dy !== 0) return vector.dy > 0 ? "DOWN" : "UP"
  return fallback
}

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const reverseDirection = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const openMove = (input, preferred) => {
  const ranked = directions.map((direction) => {
    const cell = cellFor(input.awarenessGrid, direction)
    if (cell?.contents !== "EMPTY") return [direction, -999]
    if (input.self.lastSuccessfulMoveDirection === reverseDirection[direction]) return [direction, -998]
    return [direction, direction === preferred ? 5 : 1]
  }).sort((left, right) => right[1] - left[1])
  return ranked[0]?.[1] > -900 ? ranked[0][0] : null
}

export default {
  selectActivations(input) {
    const memory = input.strategyMemory && typeof input.strategyMemory === "object" ? input.strategyMemory : {}
    const phase = memory.phase === "break" || input.phaseNumber >= 2 ? "break" : "mirror"
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => {
          const lane = directionFromVector(enemyVector(soldier, input.enemySoldiers), "UP")
          return { soldierId: soldier.id, objective: { doctrine: "mirror-breaker", lane: phase === "mirror" ? opposite[lane] : lane, phase } }
        }),
      strategyMemory: { ...memory, phase: input.phaseNumber >= 2 ? "break" : phase }
    }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverseDirection[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const lane = input.objective?.lane ?? input.self.facing ?? "UP"
    const closeEnemy = input.awarenessGrid.cells.some((cell) => cell.contents === "ENEMY_ACTIVE" && Math.abs(cell.dx) + Math.abs(cell.dy) === 1)
    const phase = input.objective?.phase ?? "mirror"
    const open = openMove(input, lane)
    if (phase === "break" && closeEnemy) {
      return { action: { type: "MOVE", direction: lane }, soldierMemory: { phase, lane } }
    }
    return { action: open ? { type: "MOVE", direction: open } : { type: "TURN", direction: lane }, soldierMemory: { phase, lane } }
  }
}
`.trim()

const centerTurtleSource = `
// Doctrine: hold central shape, avoid needless contact, and turn to stone when boxed in.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]
const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const countAdjacent = (grid, contents) =>
  grid.cells.filter((cell) => cell.contents === contents && Math.abs(cell.dx) + Math.abs(cell.dy) === 1).length

const wallEscapeScore = (grid, direction) =>
  grid.cells.reduce((score, cell) => {
    if (cell.contents !== "WALL") return score
    if (cell.dx < 0 && direction === "RIGHT") return score + 4
    if (cell.dx > 0 && direction === "LEFT") return score + 4
    if (cell.dy < 0 && direction === "DOWN") return score + 4
    if (cell.dy > 0 && direction === "UP") return score + 4
    return score
  }, 0)

const rankedDirections = (input) =>
  directions
    .map((direction) => {
    const cell = direction === "UP"
      ? input.awarenessGrid.cells.find((candidate) => candidate.dx === 0 && candidate.dy === -1)
      : direction === "RIGHT"
        ? input.awarenessGrid.cells.find((candidate) => candidate.dx === 1 && candidate.dy === 0)
        : direction === "DOWN"
          ? input.awarenessGrid.cells.find((candidate) => candidate.dx === 0 && candidate.dy === 1)
          : input.awarenessGrid.cells.find((candidate) => candidate.dx === -1 && candidate.dy === 0)
      if (cell?.contents !== "EMPTY") return [direction, -999]
      if (input.self.lastSuccessfulMoveDirection === reverse[direction]) return [direction, -998]
      const facingBonus = direction === input.self.facing ? 2 : 0
      return [direction, wallEscapeScore(input.awarenessGrid, direction) + facingBonus]
    })
    .sort((left, right) => right[1] - left[1])

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "center-turtle" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const enemies = countAdjacent(input.awarenessGrid, "ENEMY_ACTIVE")
    const walls = countAdjacent(input.awarenessGrid, "WALL")
    const ranked = rankedDirections(input)
    const direction = ranked[0]?.[0] ?? input.self.facing ?? "UP"
    if (ranked[0]?.[1] <= -900 && enemies >= 1 && walls >= 1) return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory }
    return { action: ranked[0]?.[1] > -900 ? { type: "MOVE", direction } : { type: "TURN", direction }, soldierMemory: input.soldierMemory }
  }
}
`.trim()

const aggroChaserSource = `
// Doctrine: chase the closest active enemy and force contact before slower doctrines settle.
const directionToEnemy = (self, enemies) => {
  const live = enemies.filter((soldier) => soldier.status === "ACTIVE" && soldier.position && self.position)
  live.sort((left, right) =>
    Math.abs(left.position.x - self.position.x) + Math.abs(left.position.y - self.position.y) -
    (Math.abs(right.position.x - self.position.x) + Math.abs(right.position.y - self.position.y))
  )
  const target = live[0]
  if (!target || !self.position) return self.facing ?? "UP"
  const dx = target.position.x - self.position.x
  const dy = target.position.y - self.position.y
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "RIGHT" : "LEFT") : (dy >= 0 ? "DOWN" : "UP")
}

const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const safeAggroMove = (input, lane) => {
  const target = cellFor(input.awarenessGrid, lane)
  if ((target?.contents === "EMPTY" || target?.contents === "ENEMY_ACTIVE") && input.self.lastSuccessfulMoveDirection !== reverse[lane]) {
    return lane
  }
  return ["UP", "RIGHT", "DOWN", "LEFT"].find((direction) => {
    const cell = cellFor(input.awarenessGrid, direction)
    return cell?.contents === "EMPTY" && input.self.lastSuccessfulMoveDirection !== reverse[direction]
  }) ?? null
}

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "aggro", lane: directionToEnemy(soldier, input.enemySoldiers) } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: input.soldierMemory }
    }
    const lane = input.objective?.lane ?? input.self.facing ?? "UP"
    const adjacent = input.awarenessGrid.cells.some((cell) => cell.contents === "ENEMY_ACTIVE" && Math.abs(cell.dx) + Math.abs(cell.dy) === 1)
    const move = safeAggroMove(input, lane)
    return { action: adjacent || move ? { type: "MOVE", direction: adjacent ? lane : move } : { type: "TURN", direction: lane }, soldierMemory: input.soldierMemory }
  }
}
`.trim()

const escapeArtistSource = `
// Doctrine: value future mobility, remember bad lanes, and leave threat zones before attacking.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const scoreDirection = (grid, direction, badLane) => {
  const cell = cellFor(grid, direction)
  if (!cell || cell.contents !== "EMPTY") return -20
  let score = direction === badLane ? -2 : 4
  for (const nearby of grid.cells) {
    if (nearby.contents === "ENEMY_ACTIVE") score -= Math.max(0, 3 - Math.abs(nearby.dx) - Math.abs(nearby.dy))
    if (nearby.contents === "WALL") score -= Math.max(0, 2 - Math.abs(nearby.dx) - Math.abs(nearby.dy))
  }
  return score
}

const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

export default {
  selectActivations(input) {
    const memory = input.strategyMemory && typeof input.strategyMemory === "object" ? input.strategyMemory : {}
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "escape", badLane: memory.badLane ?? null } })),
      strategyMemory: memory
    }
  },
  soldierBrain(input) {
    const memory = input.soldierMemory && typeof input.soldierMemory === "object" ? input.soldierMemory : {}
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: memory }
    }
    const ranked = directions.map((direction) => [
      direction,
      input.self.lastSuccessfulMoveDirection === reverse[direction] ? -998 : scoreDirection(input.awarenessGrid, direction, memory.badLane)
    ]).sort((left, right) => right[1] - left[1])
    const best = ranked[0][0]
    return {
      action: ranked[0][1] > 0 ? { type: "MOVE", direction: best } : { type: "TURN", direction: best },
      soldierMemory: { badLane: ranked[ranked.length - 1][0], lastEscape: best }
    }
  }
}
`.trim()

const trapSetterSource = `
// Doctrine: bait contact, remember the bait lane, then turn stone or push when the enemy commits.
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]

const nearestEnemy = (grid) =>
  grid.cells
    .filter((cell) => cell.contents === "ENEMY_ACTIVE")
    .sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - (Math.abs(right.dx) + Math.abs(right.dy)))[0]

const directionTo = (cell, fallback) => {
  if (!cell) return fallback
  if (Math.abs(cell.dx) > Math.abs(cell.dy)) return cell.dx > 0 ? "RIGHT" : "LEFT"
  if (cell.dy !== 0) return cell.dy > 0 ? "DOWN" : "UP"
  return fallback
}

const cellFor = (grid, direction) => {
  if (direction === "UP") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === -1)
  if (direction === "RIGHT") return grid.cells.find((cell) => cell.dx === 1 && cell.dy === 0)
  if (direction === "DOWN") return grid.cells.find((cell) => cell.dx === 0 && cell.dy === 1)
  return grid.cells.find((cell) => cell.dx === -1 && cell.dy === 0)
}

const reverse = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" }

const openMove = (input, preferred) => {
  const ranked = directions.map((direction) => {
    const cell = cellFor(input.awarenessGrid, direction)
    if (cell?.contents !== "EMPTY") return [direction, -999]
    if (input.self.lastSuccessfulMoveDirection === reverse[direction]) return [direction, -998]
    return [direction, direction === preferred ? 4 : 1]
  }).sort((left, right) => right[1] - left[1])
  return ranked[0]?.[1] > -900 ? ranked[0][0] : null
}

export default {
  selectActivations(input) {
    const memory = input.strategyMemory && typeof input.strategyMemory === "object" ? input.strategyMemory : {}
    const baitLane = memory.baitLane ?? directions[input.phaseNumber % directions.length]
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { doctrine: "trap", baitLane } })),
      strategyMemory: { ...memory, baitLane }
    }
  },
  soldierBrain(input) {
    const memory = input.soldierMemory && typeof input.soldierMemory === "object" ? input.soldierMemory : {}
    if (input.cycleIndex >= 4 && input.self.lastSuccessfulMoveDirection) {
      return { action: { type: "MOVE", direction: reverse[input.self.lastSuccessfulMoveDirection] }, soldierMemory: memory }
    }
    const enemy = nearestEnemy(input.awarenessGrid)
    const lane = directionTo(enemy, input.objective?.baitLane ?? memory.baitLane ?? input.self.facing ?? "UP")
    const close = enemy && Math.abs(enemy.dx) + Math.abs(enemy.dy) === 1
    const move = openMove(input, lane)
    if (close && !move && input.cycleIndex > 0) {
      return { action: { type: "TURN_TO_STONE" }, soldierMemory: { baitLane: lane, sprung: true } }
    }
    return { action: move ? { type: "MOVE", direction: move } : { type: "TURN", direction: lane }, soldierMemory: { baitLane: lane, sprung: false } }
  }
}
`.trim()

export const STARTER_STRATEGY_DEFINITIONS: readonly StarterStrategyDefinition[] =
  [
    {
      id: "starter:centerline-bully",
      name: "Centerline Bully",
      version: "v1",
      description:
        "Claims central lanes early, faces pressure, and tries to keep enemies moving toward shrinking danger.",
      tags: ["Center control", "Pressure", "Readable"],
      doctrineNotes: [
        "Selects central Soldiers first.",
        "Faces nearby enemies before advancing.",
        "Avoids pure edge camping.",
      ],
      expectedBehavior:
        "Often wins space against passive or corner-focused opponents.",
      usesMemory: false,
      source: centerlineBullySource,
    },
    {
      id: "starter:corner-lurker",
      name: "Corner Lurker",
      version: "v1",
      description:
        "Defends near safer corners and punishes reckless contact with STONE.",
      tags: ["Defense", "Corners", "STONE"],
      doctrineNotes: [
        "Activates from the back of the formation.",
        "Moves only when a safe opening appears.",
        "Turns to STONE when pressure and wall safety align.",
      ],
      expectedBehavior: "Outlasts some rushers but can lose central tempo.",
      usesMemory: false,
      source: cornerLurkerSource,
    },
    {
      id: "starter:backstab-hunter",
      name: "Backstab Hunter",
      version: "v1",
      description:
        "Tracks rear-facing opportunities and remembers the most promising chase lane.",
      tags: ["Backstab", "Memory", "Tactics"],
      doctrineNotes: [
        "Looks for enemies whose rear arc is exposed.",
        "Stores the last useful lane in SoldierMemory.",
        "Closes distance when a legal rear approach appears.",
      ],
      expectedBehavior:
        "Can punish opponents that turn away while repositioning.",
      usesMemory: true,
      source: backstabHunterSource,
    },
    {
      id: "starter:wall-press",
      name: "Wall Press",
      version: "v1",
      description:
        "Uses the edge of the board as a pressure tool and advances when enemies are near constrained lanes.",
      tags: ["Edges", "Push", "Pressure"],
      doctrineNotes: [
        "Finds nearby active enemies.",
        "Faces and advances along the pressure lane.",
        "Treats walls as leverage, not just danger.",
      ],
      expectedBehavior: "Creates messy fights where edge-aware play matters.",
      usesMemory: false,
      source: wallPressSource,
    },
    {
      id: "starter:ring-runner",
      name: "Ring Runner",
      version: "v1",
      description:
        "Orbits the shrinking ring and remembers its turn direction between decisions.",
      tags: ["Mobility", "Memory", "Contraction"],
      doctrineNotes: [
        "Keeps a persistent orbit direction.",
        "Moves forward while open.",
        "Turns around obstacles instead of freezing in place.",
      ],
      expectedBehavior: "Survives well against slow center-only doctrines.",
      usesMemory: true,
      source: ringRunnerSource,
    },
    {
      id: "starter:mirror-breaker",
      name: "Mirror Breaker",
      version: "v1",
      description:
        "Mirrors enemy pressure early, then breaks symmetry once the board tightens.",
      tags: ["Symmetry", "Memory", "Timing"],
      doctrineNotes: [
        "Starts by moving away from the nearest pressure vector.",
        "Switches into a break phase after early play.",
        "Uses memory to keep phase identity readable.",
      ],
      expectedBehavior:
        "Avoids early traps and becomes more assertive as space shrinks.",
      usesMemory: true,
      source: mirrorBreakerSource,
    },
    {
      id: "starter:center-turtle",
      name: "Center Turtle",
      version: "v1",
      description:
        "Holds a stable central posture, avoids unnecessary adjacency, and stones when boxed.",
      tags: ["Defense", "Center", "Stable"],
      doctrineNotes: [
        "Activates active Soldiers in formation order.",
        "Turns before moving when enough options remain.",
        "Uses STONE only under pressure.",
      ],
      expectedBehavior:
        "Draws or outlasts reckless movement, but may lack finishing pressure.",
      usesMemory: false,
      source: centerTurtleSource,
    },
    {
      id: "starter:aggro-chaser",
      name: "Aggro Chaser",
      version: "v1",
      description:
        "Pursues the closest active enemy and forces contact quickly.",
      tags: ["Aggro", "Chase", "Contact"],
      doctrineNotes: [
        "Selects active Soldiers directly.",
        "Targets the closest enemy lane.",
        "Moves into contact on alternating cycles.",
      ],
      expectedBehavior:
        "Can overwhelm passive Strategies but overextends into traps.",
      usesMemory: false,
      source: aggroChaserSource,
    },
    {
      id: "starter:escape-artist",
      name: "Escape Artist",
      version: "v1",
      description:
        "Optimizes legal exits from threat zones and remembers bad lanes.",
      tags: ["Mobility", "Memory", "Survival"],
      doctrineNotes: [
        "Scores open directions by nearby enemies and walls.",
        "Prefers future mobility over immediate contact.",
        "Stores the least promising lane in SoldierMemory.",
      ],
      expectedBehavior:
        "Escapes pins reliably but may miss direct attack chances.",
      usesMemory: true,
      source: escapeArtistSource,
    },
    {
      id: "starter:trap-setter",
      name: "Trap Setter",
      version: "v1",
      description:
        "Baits pursuit along a remembered lane and turns to STONE when contact arrives.",
      tags: ["Trap", "Memory", "STONE"],
      doctrineNotes: [
        "Chooses a bait lane from StrategyMemory.",
        "Moves just enough to invite pursuit.",
        "Springs the trap with STONE under adjacency.",
      ],
      expectedBehavior:
        "Punishes straight-line attackers when contact timing lines up.",
      usesMemory: true,
      source: trapSetterSource,
    },
  ] as const

export const listStarterStrategies = (): StarterStrategySummary[] =>
  STARTER_STRATEGY_DEFINITIONS.map((starter) => {
    const validation = validateStrategySource(starter.source)
    return {
      ...starter,
      validation,
      sourceHash: validation.sourceHash,
      sourceBytes: validation.sourceBytes,
    }
  })

export const findStarterStrategy = (
  starterId: StarterStrategyId | string,
): StarterStrategySummary | null =>
  listStarterStrategies().find((starter) => starter.id === starterId) ?? null

export const buildStarterStrategyRevision = (
  starter: StarterStrategyDefinition,
): StrategyRevision =>
  buildStrategyRevision({
    source: starter.source,
    strategyId: `strategy:system:${starter.id}`,
    metadata: {
      createdBy: "system:starter-library",
      label: starter.name,
      notes: starter.description,
      tags: starter.tags,
      starterLineage: {
        starterId: starter.id,
        starterName: starter.name,
        starterVersion: starter.version,
        sourceHash: validateStrategySource(starter.source).sourceHash,
      },
    },
  })
