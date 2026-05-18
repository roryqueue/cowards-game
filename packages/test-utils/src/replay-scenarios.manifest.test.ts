import { describe, expect, it } from "vitest"
import {
  getCanonicalReplayScenario,
  getCanonicalReplayScenarioIds,
  getCanonicalReplayScenarios,
  type CanonicalReplayScenarioId,
} from "./replay-scenarios.js"

const expectedIds = [
  "push",
  "fall",
  "contraction",
  "legal-backstab",
  "runtime-failure",
  "endgame",
  "compound-tour",
] as const satisfies readonly CanonicalReplayScenarioId[]

const requiredEventTypesById = {
  push: "PUSH_RESOLVED",
  fall: "SOLDIER_FELL",
  contraction: "CONTRACTION_RESOLVED",
  "legal-backstab": "BACKSTAB_RESOLVED",
  "runtime-failure": "RUNTIME_VIOLATION",
  endgame: "MATCH_ENDED",
  "compound-tour": "MATCH_ENDED",
} as const satisfies Record<CanonicalReplayScenarioId, string>

describe("[engine legality] canonical replay scenarios", () => {
  it("exposes the exact canonical replay scenario IDs", () => {
    expect(getCanonicalReplayScenarioIds()).toEqual(expectedIds)
  })

  it("builds every canonical Chronicle through the scenario manifest", () => {
    const scenarios = getCanonicalReplayScenarios()

    expect(scenarios.map((scenario) => scenario.id)).toEqual(expectedIds)

    for (const scenario of scenarios) {
      const eventTypes = scenario.chronicle.events.map((event) => event.type)

      expect(scenario.title).not.toHaveLength(0)
      expect(scenario.chronicle.schemaVersion).toBe("chronicle-v1")
      expect(scenario.chronicle.events.length).toBeGreaterThan(0)
      expect(scenario.expectedEventTypes.length).toBeGreaterThan(0)
      expect(scenario.visualCheckpoints.length).toBeGreaterThan(0)
      expect(eventTypes).toContain(requiredEventTypesById[scenario.id])

      for (const expectedEventType of scenario.expectedEventTypes) {
        expect(eventTypes).toContain(expectedEventType)
      }
    }
  })

  it("points visual checkpoints at existing Chronicle sequences", () => {
    for (const scenario of getCanonicalReplayScenarios()) {
      for (const checkpoint of scenario.visualCheckpoints) {
        const event = scenario.chronicle.events[checkpoint.sequence]

        expect(event?.sequence).toBe(checkpoint.sequence)
        expect(event?.type).toBe(checkpoint.eventType)
        expect(checkpoint.name).not.toHaveLength(0)
        expect(checkpoint.assertions.length).toBeGreaterThan(0)
        expect(
          checkpoint.assertions.every((assertion) => assertion.length > 0),
        ).toBe(true)
        expect(
          checkpoint.assertions.some((assertion) =>
            /\b(board|callout)\b/i.test(assertion),
          ),
        ).toBe(true)
      }
    }
  })

  it("builds a terminal endgame Chronicle with one MATCH_ENDED event", () => {
    const endgame = getCanonicalReplayScenario("endgame")
    const matchEndedEvents = endgame.chronicle.events.filter(
      (event) => event.type === "MATCH_ENDED",
    )

    expect(matchEndedEvents).toHaveLength(1)
    expect(endgame.chronicle.snapshots.at(-1)?.kind).toBe("TERMINAL")
  })

  it("returns scenarios by ID", () => {
    for (const id of expectedIds) {
      expect(getCanonicalReplayScenario(id).id).toBe(id)
    }
  })
})
