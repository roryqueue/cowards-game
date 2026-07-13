import { describe, expect, it } from "vitest"
import {
  COMPATIBILITY_DIMENSIONS,
  LOCKED_V1_4_FIXTURE_HASHES,
  captureV14CompatibilityCorpus,
  findLockedCompatibilityDrift,
} from "./fixtures/v1-4-compatibility.js"
import type { GameState } from "./types.js"

const byName = () =>
  new Map(
    captureV14CompatibilityCorpus().map((fixture) => [fixture.name, fixture]),
  )

const finalStateOf = (name: string): GameState => {
  const fixture = byName().get(name)
  if (!fixture) {
    throw new Error(`Missing compatibility fixture: ${name}`)
  }
  return fixture.observation.finalState as GameState
}

describe("v1.4 full-observation compatibility corpus", () => {
  it("locks exactly the 20 independently named audited scenarios", () => {
    const fixtures = captureV14CompatibilityCorpus()

    expect(fixtures).toHaveLength(20)
    expect(new Set(fixtures.map(({ name }) => name))).toHaveLength(20)
    expect(fixtures.map(({ name }) => name)).toEqual(
      Object.keys(LOCKED_V1_4_FIXTURE_HASHES),
    )
    expect(findLockedCompatibilityDrift(fixtures)).toEqual([])
  })

  it("captures every full-observation dimension with deterministic hashes", () => {
    const first = captureV14CompatibilityCorpus()
    const second = captureV14CompatibilityCorpus()

    expect(second).toEqual(first)
    for (const fixture of first) {
      expect(Object.keys(fixture.dimensionHashes)).toEqual([
        ...COMPATIBILITY_DIMENSIONS,
      ])
      for (const dimension of COMPATIBILITY_DIMENSIONS) {
        expect(fixture.observation[dimension]).toBeDefined()
        expect(fixture.dimensionHashes[dimension]).toMatch(
          /^sha256:[0-9a-f]{64}$/u,
        )
      }
      expect(fixture.overallHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
    }
  })

  it("preserves collision, blocking, reversal, and successful-push history rulings", () => {
    const fixtures = byName()
    expect(
      fixtures.get("same-direction-rear-approach-blocks")?.observation.events[0]
        ?.payload,
    ).toMatchObject({ reason: "ACTIVE_SOLDIER" })
    expect(
      fixtures.get("head-to-head-distinction-blocks")?.observation.events[0]
        ?.payload,
    ).toMatchObject({ reason: "HEAD_TO_HEAD" })
    expect(
      fixtures.get("terrain-block-is-non-terminal")?.observation.events[0]
        ?.payload,
    ).toMatchObject({ reason: "TERRAIN_STONE" })
    expect(
      fixtures.get("stone-soldier-block-is-non-terminal")?.observation.events[0]
        ?.payload,
    ).toMatchObject({ reason: "STONE_SOLDIER" })
    expect(
      fixtures.get("failed-push-is-non-terminal")?.observation.events[0]?.type,
    ).toBe("PUSH_BLOCKED")
    expect(
      fixtures.get("illegal-reversal-is-terminal")?.observation.events[0]
        ?.payload,
    ).toMatchObject({ reason: "IMMEDIATE_REVERSAL" })

    const pushed = finalStateOf(
      "successful-side-push-preserves-history-ruling",
    ).soldiers
    expect(
      pushed.find(({ id }) => id === "pusher")?.lastSuccessfulMoveDirection,
    ).toBe("RIGHT")
    expect(
      pushed.find(({ id }) => id === "pushed")?.lastSuccessfulMoveDirection,
    ).toBe("LEFT")
  })

  it("preserves Cycle-interleaved snake order, initiative, and fresh observations", () => {
    const fixture = byName().get("cycle-interleaved-snake-order-and-initiative")
    expect(
      (fixture?.observation.initialState as GameState).initiativePlayerId,
    ).toBe("bottom")
    expect(
      fixture?.observation.soldierBrainObservations.map((input) => [
        input.self.id,
        input.cycleIndex,
      ]),
    ).toEqual([
      ["b1", 0],
      ["t1", 0],
      ["t2", 0],
      ["b2", 0],
      ["b1", 1],
      ["t1", 1],
      ["t2", 1],
      ["b2", 1],
    ])
  })

  it("retains Cycle-start/Cycle-end simultaneous Backstab and boundary eligibility", () => {
    const fixtures = byName()
    const cycleStart = fixtures.get("cycle-start-backstab-precedes-observation")
    expect(
      cycleStart?.observation.events.map(({ type }) => type).slice(0, 3),
    ).toEqual(["CYCLE_STARTED", "BACKSTAB_RESOLVED", "SOLDIER_STONED"])
    expect(
      cycleStart?.observation.events.findIndex(
        ({ type }) => type === "BACKSTAB_RESOLVED",
      ),
    ).toBeLessThan(
      cycleStart?.observation.events.findIndex(
        ({ type }) => type === "AWARENESS_GRID_OBSERVED",
      ) ?? -1,
    )

    for (const name of [
      "cycle-end-backstab-after-action",
      "mutual-backstab-is-simultaneous",
      "multi-victim-backstab-ignores-attacker-facing",
      "push-creates-cycle-end-backstab-eligibility",
      "turn-creates-cycle-end-backstab-eligibility",
    ]) {
      expect(
        fixtures
          .get(name)
          ?.observation.events.some(({ type }) => type === "BACKSTAB_RESOLVED"),
      ).toBe(true)
    }

    const mutual = finalStateOf("mutual-backstab-is-simultaneous").soldiers
    expect(mutual.map(({ status }) => status)).toEqual(["STONE", "STONE"])
    const multiVictim = finalStateOf(
      "multi-victim-backstab-ignores-attacker-facing",
    ).soldiers
    expect(
      multiVictim
        .filter(({ id }) => id === "b" || id === "c")
        .map(({ status }) => status),
    ).toEqual(["STONE", "STONE"])
  })

  it("preserves contraction/final outcome and one terminal event", () => {
    const contraction = byName().get("contraction-resolves-final-two-by-two")
    expect((contraction?.observation.finalState as GameState).bounds).toEqual({
      minX: 1,
      maxX: 2,
      minY: 1,
      maxY: 2,
    })
    expect(contraction?.observation.outcome).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom",
    })

    const terminal = byName().get("terminal-push-emits-one-match-ended")
    expect(terminal?.observation.terminalEventCount).toBe(1)
    expect(terminal?.observation.events.at(-1)?.type).toBe("MATCH_ENDED")
    expect(
      terminal?.observation.events.filter(({ type }) => type === "MATCH_ENDED"),
    ).toHaveLength(1)
  })

  it("distinguishes player cleanup from unchanged system failure", () => {
    const fixtures = byName()
    const player = fixtures.get("player-violation-applies-gameplay-cleanup")
    expect(player?.observation.failureTrace).toEqual([
      {
        classification: "playerViolation",
        code: "TIMEOUT",
        gameplayMutation: true,
      },
    ])
    expect(
      (player?.observation.finalState as GameState).soldiers.find(
        ({ id }) => id === "actor",
      )?.status,
    ).toBe("STONE")

    const system = fixtures.get("system-failure-leaves-gameplay-unchanged")
    expect(system?.observation.failureTrace).toEqual([
      {
        classification: "systemFailure",
        code: "SPAWN_FAILED",
        gameplayMutation: false,
      },
    ])
    expect(system?.observation.finalState).toEqual(
      system?.observation.initialState,
    )
    expect(system?.observation.events).toEqual([])
  })

  it("locks Strategy/Soldier memory and objective handoff order", () => {
    const observation = byName().get(
      "strategy-observation-memory-objective-ordering",
    )?.observation
    expect(observation?.runtimeCalls.map(({ kind }) => kind)).toEqual([
      "selectActivations",
      "runSoldierBrain",
      "runSoldierBrain",
    ])
    expect(observation?.memoryHandoffs).toEqual([
      {
        kind: "strategy",
        before: { selection: 0 },
        after: { selection: 1 },
      },
      {
        kind: "soldier",
        cycleIndex: 0,
        before: { count: 0 },
        after: { count: 1 },
      },
      {
        kind: "soldier",
        cycleIndex: 1,
        before: { count: 1 },
        after: { count: 2 },
      },
    ])
    expect(observation?.objectiveHandoffs).toEqual([
      { cycleIndex: 0, objective: { role: "advance", priority: 1 } },
      { cycleIndex: 1, objective: { role: "advance", priority: 1 } },
    ])
  })

  it("keeps HOLD and END_ACTIVATION outside the valid v1.4 corpus", () => {
    const serializedEvents = JSON.stringify(
      captureV14CompatibilityCorpus().flatMap(
        ({ observation }) => observation.events,
      ),
    )
    expect(serializedEvents).not.toContain("HOLD")
    expect(serializedEvents).not.toContain("END_ACTIVATION")
  })
})
