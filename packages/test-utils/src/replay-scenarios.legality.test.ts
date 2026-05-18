import { createReplay, validateChronicle } from "@cowards/replay"
import type {
  BoardBounds,
  Chronicle,
  ChronicleEvent,
  ChronicleValidationError,
  FullBoardSnapshot,
  JsonValue,
  Position,
  SoldierSnapshot,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  getCanonicalReplayScenario,
  getCanonicalReplayScenarios,
  type CanonicalReplayScenario,
} from "./replay-scenarios.js"

type ReconstructedEntry = {
  sequence: number
  event: ChronicleEvent
  state: {
    board: FullBoardSnapshot
    outcome?: unknown
  }
}

const isRecord = (value: unknown): value is Record<string, JsonValue> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const firstError = (errors: readonly ChronicleValidationError[]): string => {
  const error = errors[0]
  return error ? `${error.code}: ${error.message}` : "unknown error"
}

const cloneChronicle = (chronicle: Chronicle): Chronicle =>
  JSON.parse(JSON.stringify(chronicle)) as Chronicle

const chronicleError = (
  scenarioId: string,
  errors: readonly ChronicleValidationError[],
): Error =>
  new Error(`[Chronicle validation] ${scenarioId}: ${firstError(errors)}`)

const replayError = (
  scenarioId: string,
  errors: readonly ChronicleValidationError[],
): Error =>
  new Error(`[replay reconstruction] ${scenarioId}: ${firstError(errors)}`)

const readString = (
  payload: JsonValue,
  key: string,
  scenarioId: string,
): string => {
  if (!isRecord(payload) || typeof payload[key] !== "string") {
    throw new Error(
      `[engine legality] ${scenarioId}: missing string payload.${key}`,
    )
  }
  return payload[key]
}

const readBoolean = (
  payload: JsonValue,
  key: string,
  scenarioId: string,
): boolean => {
  if (!isRecord(payload) || typeof payload[key] !== "boolean") {
    throw new Error(
      `[engine legality] ${scenarioId}: missing boolean payload.${key}`,
    )
  }
  return payload[key]
}

const readBounds = (payload: JsonValue, scenarioId: string): BoardBounds => {
  const bounds = isRecord(payload) ? payload.bounds : undefined
  if (
    !isRecord(bounds) ||
    typeof bounds.minX !== "number" ||
    typeof bounds.maxX !== "number" ||
    typeof bounds.minY !== "number" ||
    typeof bounds.maxY !== "number"
  ) {
    throw new Error(`[engine legality] ${scenarioId}: missing bounds payload`)
  }
  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
  }
}

const readBackstabPairs = (
  event: ChronicleEvent,
  scenarioId: string,
): Array<{ attackerId: string; victimId: string }> => {
  const pairs = isRecord(event.payload) ? event.payload.pairs : undefined
  if (!Array.isArray(pairs)) {
    throw new Error(
      `[engine legality] ${scenarioId}: BACKSTAB_RESOLVED missing pairs`,
    )
  }

  return pairs.map((pair) => {
    if (
      !isRecord(pair) ||
      typeof pair.attackerId !== "string" ||
      typeof pair.victimId !== "string"
    ) {
      throw new Error(
        `[engine legality] ${scenarioId}: invalid BACKSTAB_RESOLVED pair`,
      )
    }
    return { attackerId: pair.attackerId, victimId: pair.victimId }
  })
}

const samePosition = (left: Position, right: Position): boolean =>
  left.x === right.x && left.y === right.y

const isWithinBounds = (position: Position, bounds: BoardBounds): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

const moveByDelta = (from: Position, delta: Position): Position => ({
  x: from.x + delta.x,
  y: from.y + delta.y,
})

const pushDelta = (mover: Position, target: Position): Position | undefined => {
  const delta = { x: target.x - mover.x, y: target.y - mover.y }
  return Math.abs(delta.x) + Math.abs(delta.y) === 1 ? delta : undefined
}

const behindSquare = (victim: SoldierSnapshot): Position | null => {
  if (victim.position === null || victim.facing === null) {
    return null
  }

  switch (victim.facing) {
    case "UP":
      return { x: victim.position.x, y: victim.position.y + 1 }
    case "DOWN":
      return { x: victim.position.x, y: victim.position.y - 1 }
    case "LEFT":
      return { x: victim.position.x + 1, y: victim.position.y }
    case "RIGHT":
      return { x: victim.position.x - 1, y: victim.position.y }
  }
}

const findSoldier = (
  board: FullBoardSnapshot,
  soldierId: string,
  scenarioId: string,
): SoldierSnapshot => {
  const soldier = board.soldiers.find((candidate) => candidate.id === soldierId)
  if (!soldier) {
    throw new Error(
      `[engine legality] ${scenarioId}: Soldier ${soldierId} missing from board`,
    )
  }
  return soldier
}

const occupyingSoldier = (
  board: FullBoardSnapshot,
  position: Position,
): SoldierSnapshot | undefined =>
  board.soldiers.find(
    (soldier) =>
      soldier.status !== "FALLEN" &&
      soldier.position !== null &&
      samePosition(soldier.position, position),
  )

const findEvent = (
  scenario: CanonicalReplayScenario,
  type: ChronicleEvent["type"],
): ChronicleEvent => {
  const event = scenario.chronicle.events.find(
    (candidate) => candidate.type === type,
  )
  if (!event) {
    throw new Error(`[engine legality] ${scenario.id}: missing ${type}`)
  }
  return event
}

const validateScenario = (scenario: CanonicalReplayScenario): void => {
  const validation = validateChronicle(scenario.chronicle)
  if (!validation.ok) {
    throw chronicleError(scenario.id, validation.errors)
  }
}

const reconstructScenario = (
  scenario: CanonicalReplayScenario,
): ReconstructedEntry[] => {
  validateScenario(scenario)

  const replayResult = createReplay(scenario.chronicle)
  if (!replayResult.ok) {
    throw replayError(scenario.id, replayResult.errors)
  }

  const entries: ReconstructedEntry[] = []
  for (const event of scenario.chronicle.events) {
    const stateResult = replayResult.replay.stateAt(event.sequence)
    if (!stateResult.ok) {
      throw replayError(scenario.id, stateResult.errors)
    }
    entries.push({
      sequence: event.sequence,
      event,
      state: stateResult.state,
    })
  }

  const iteratedEntries = [...replayResult.replay.iterateReplay()]
  if (iteratedEntries.length !== scenario.chronicle.events.length) {
    throw new Error(
      `[replay reconstruction] ${scenario.id}: replay iteration stopped at ${iteratedEntries.length} of ${scenario.chronicle.events.length} events`,
    )
  }

  return entries
}

const stateBefore = (
  entries: readonly ReconstructedEntry[],
  event: ChronicleEvent,
  scenarioId: string,
): ReconstructedEntry => {
  const entry = entries.find(
    (candidate) => candidate.sequence === event.sequence - 1,
  )
  if (!entry) {
    throw new Error(
      `[engine legality] ${scenarioId}: missing reconstructed state before sequence ${event.sequence}`,
    )
  }
  return entry
}

const stateAt = (
  entries: readonly ReconstructedEntry[],
  event: ChronicleEvent,
  scenarioId: string,
): ReconstructedEntry => {
  const entry = entries.find(
    (candidate) => candidate.sequence === event.sequence,
  )
  if (!entry) {
    throw new Error(
      `[engine legality] ${scenarioId}: missing reconstructed state at sequence ${event.sequence}`,
    )
  }
  return entry
}

const reconstructChronicleErrors = (
  scenarioId: string,
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const replayResult = createReplay(chronicle)
  if (!replayResult.ok) {
    return replayResult.errors
  }

  for (const event of chronicle.events) {
    const stateResult = replayResult.replay.stateAt(event.sequence)
    if (!stateResult.ok) {
      return stateResult.errors
    }
  }

  const iteratedCount = [...replayResult.replay.iterateReplay()].length
  if (iteratedCount !== chronicle.events.length) {
    return [
      {
        code: "SNAPSHOT_MISMATCH",
        message: `[Chronicle validation] ${scenarioId}: replay iteration ended early.`,
      },
    ]
  }

  return []
}

const expectChronicleLayerFailure = (
  scenarioId: string,
  chronicle: Chronicle,
): void => {
  const errors = reconstructChronicleErrors(scenarioId, chronicle)
  if (errors.length === 0) {
    throw new Error(
      `[Chronicle validation] ${scenarioId}: impossible beat was accepted`,
    )
  }

  const message = chronicleError(scenarioId, errors).message
  expect(message).toMatch(/^\[Chronicle validation\]/)
  expect(errors.map((error) => error.code)).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^SNAPSHOT_(MISMATCH|MISSING)$/),
    ]),
  )
}

describe("[Chronicle validation] canonical replay scenarios", () => {
  it("[Chronicle validation] every canonical scenario validates", () => {
    for (const scenario of getCanonicalReplayScenarios()) {
      validateScenario(scenario)
    }
  })

  it("[Chronicle validation] every canonical scenario reconstructs", () => {
    for (const scenario of getCanonicalReplayScenarios()) {
      const entries = reconstructScenario(scenario)

      expect(entries).toHaveLength(scenario.chronicle.events.length)
      expect(entries.map((entry) => entry.sequence)).toEqual(
        scenario.chronicle.events.map((event) => event.sequence),
      )
    }
  })
})

describe("[engine legality] canonical replay scenario mechanics", () => {
  it("[engine legality] push scenario resolves into legal destination or fallout", () => {
    const scenario = getCanonicalReplayScenario("push")
    const entries = reconstructScenario(scenario)
    const event = findEvent(scenario, "PUSH_RESOLVED")
    const before = stateBefore(entries, event, scenario.id).state.board
    const after = stateAt(entries, event, scenario.id).state.board
    const moverId = readString(event.payload, "soldierId", scenario.id)
    const targetId = readString(event.payload, "targetSoldierId", scenario.id)
    const pushedOffBoard = readBoolean(
      event.payload,
      "pushedOffBoard",
      scenario.id,
    )
    const mover = findSoldier(before, moverId, scenario.id)
    const targetBefore = findSoldier(before, targetId, scenario.id)

    expect(mover.status).toBe("ACTIVE")
    expect(targetBefore.status).not.toBe("FALLEN")
    expect(mover.position).not.toBeNull()
    expect(targetBefore.position).not.toBeNull()

    const delta = pushDelta(mover.position!, targetBefore.position!)
    expect(delta).toBeDefined()

    const targetAfter = findSoldier(after, targetId, scenario.id)
    const destination = moveByDelta(targetBefore.position!, delta!)

    if (pushedOffBoard) {
      expect(isWithinBounds(destination, before.bounds)).toBe(false)
      expect(targetAfter).toMatchObject({ status: "FALLEN", position: null })
    } else {
      expect(isWithinBounds(destination, before.bounds)).toBe(true)
      expect(occupyingSoldier(before, destination)).toBeUndefined()
      expect(targetAfter.position).toEqual(destination)
      expect(targetAfter.status).not.toBe("FALLEN")
    }
  })

  it("[engine legality] fall scenario transitions a Soldier to FALLEN off-board", () => {
    const scenario = getCanonicalReplayScenario("fall")
    const entries = reconstructScenario(scenario)
    const event =
      scenario.chronicle.events.find(
        (candidate) =>
          candidate.type === "PUSH_RESOLVED" &&
          isRecord(candidate.payload) &&
          candidate.payload.pushedOffBoard === true,
      ) ?? findEvent(scenario, "SOLDIER_FELL")
    const before = stateBefore(entries, event, scenario.id).state.board
    const after = stateAt(entries, event, scenario.id).state.board
    const soldierId =
      event.type === "PUSH_RESOLVED"
        ? readString(event.payload, "targetSoldierId", scenario.id)
        : readString(event.payload, "soldierId", scenario.id)
    const soldierBefore = findSoldier(before, soldierId, scenario.id)
    const soldierAfter = findSoldier(after, soldierId, scenario.id)

    expect(["ACTIVE", "STONE"]).toContain(soldierBefore.status)
    expect(soldierBefore.position).not.toBeNull()
    expect(soldierAfter).toMatchObject({ status: "FALLEN", position: null })
  })

  it("[engine legality] contraction scenario shrinks bounds and falls outside Soldiers", () => {
    const scenario = getCanonicalReplayScenario("contraction")
    const entries = reconstructScenario(scenario)
    const event = findEvent(scenario, "CONTRACTION_RESOLVED")
    const before = stateBefore(entries, event, scenario.id).state.board
    const final = entries.at(-1)?.state.board
    if (!final) {
      throw new Error(`[engine legality] ${scenario.id}: missing final state`)
    }

    const newBounds = readBounds(event.payload, scenario.id)
    expect(newBounds.minX).toBeGreaterThan(before.bounds.minX)
    expect(newBounds.maxX).toBeLessThan(before.bounds.maxX)
    expect(newBounds.minY).toBeGreaterThan(before.bounds.minY)
    expect(newBounds.maxY).toBeLessThan(before.bounds.maxY)

    const outsideSoldiers = before.soldiers.filter(
      (soldier) =>
        soldier.status !== "FALLEN" &&
        soldier.position !== null &&
        !isWithinBounds(soldier.position, newBounds),
    )

    expect(outsideSoldiers.length).toBeGreaterThan(0)
    for (const soldier of outsideSoldiers) {
      expect(findSoldier(final, soldier.id, scenario.id)).toMatchObject({
        status: "FALLEN",
        position: null,
      })
    }
  })

  it("[engine legality] legal-backstab scenario has attackers directly behind victims", () => {
    const scenario = getCanonicalReplayScenario("legal-backstab")
    const entries = reconstructScenario(scenario)
    const backstabEvents = scenario.chronicle.events.filter(
      (event) => event.type === "BACKSTAB_RESOLVED",
    )

    expect(backstabEvents.length).toBeGreaterThan(0)
    for (const event of backstabEvents) {
      const before = stateBefore(entries, event, scenario.id).state.board
      for (const pair of readBackstabPairs(event, scenario.id)) {
        const attacker = findSoldier(before, pair.attackerId, scenario.id)
        const victim = findSoldier(before, pair.victimId, scenario.id)
        const expectedAttackerPosition = behindSquare(victim)

        expect(attacker.status).toBe("ACTIVE")
        expect(victim.status).toBe("ACTIVE")
        expect(attacker.ownerPlayerId).not.toBe(victim.ownerPlayerId)
        expect(attacker.position).not.toBeNull()
        expect(expectedAttackerPosition).not.toBeNull()
        expect(attacker.position).toEqual(expectedAttackerPosition)
      }
    }
  })

  it("[engine legality] runtime-failure scenario keeps violation payload public-safe", () => {
    const scenario = getCanonicalReplayScenario("runtime-failure")
    reconstructScenario(scenario)
    const event = findEvent(scenario, "RUNTIME_VIOLATION")
    const serializedPayload = JSON.stringify(event.payload)

    expect(event.privacy).toBe("owner")
    expect(event.privateRef).toMatch(/^private:event:/)
    expect(serializedPayload).not.toMatch(
      /source|strategyMemory|soldierMemory|objective|message|stack|Deterministic replay scenario/i,
    )
  })

  it("[engine legality] endgame scenario has one terminal MATCH_ENDED outcome", () => {
    const scenario = getCanonicalReplayScenario("endgame")
    const entries = reconstructScenario(scenario)
    const matchEndedEvents = scenario.chronicle.events.filter(
      (event) => event.type === "MATCH_ENDED",
    )
    const final = entries.at(-1)?.state

    expect(matchEndedEvents).toHaveLength(1)
    expect(matchEndedEvents[0]?.sequence).toBe(entries.at(-1)?.sequence)
    expect(final?.outcome).toBeDefined()
  })
})

describe("[Chronicle validation] impossible canonical replay beats", () => {
  it("[Chronicle validation] rejects a push event whose Soldiers are not adjacent", () => {
    const scenario = getCanonicalReplayScenario("push")
    const chronicle = cloneChronicle(scenario.chronicle)
    const pushEvent = chronicle.events.find(
      (event) => event.type === "PUSH_RESOLVED",
    )
    if (!pushEvent || !isRecord(pushEvent.payload)) {
      throw new Error(
        `[Chronicle validation] ${scenario.id}: missing push event`,
      )
    }

    pushEvent.payload = {
      ...pushEvent.payload,
      targetSoldierId: "top-soldier-1",
    }

    expectChronicleLayerFailure(`${scenario.id}:impossible-push`, chronicle)
  })

  it("[Chronicle validation] rejects contraction snapshots that cannot attach to events", () => {
    const scenario = getCanonicalReplayScenario("contraction")
    const chronicle = cloneChronicle(scenario.chronicle)
    const contractionSnapshot = chronicle.snapshots.find(
      (snapshot) => snapshot.kind === "CONTRACTION",
    )
    if (!contractionSnapshot) {
      throw new Error(
        `[Chronicle validation] ${scenario.id}: missing contraction snapshot`,
      )
    }

    contractionSnapshot.sequence = chronicle.events.length + 100

    expectChronicleLayerFailure(
      `${scenario.id}:impossible-contraction`,
      chronicle,
    )
  })
})
