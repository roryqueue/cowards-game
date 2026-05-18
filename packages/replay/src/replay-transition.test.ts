import type {
  Chronicle,
  ChronicleEvent,
  FullBoardSnapshot,
  SoldierSnapshot,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { validateChronicleTransitions } from "./replay-transition.js"

const soldier = (
  id: string,
  overrides: Partial<SoldierSnapshot> = {},
): SoldierSnapshot => ({
  id,
  ownerPlayerId: id.startsWith("top") ? "top" : "bottom",
  status: "ACTIVE",
  position: { x: 1, y: 1 },
  facing: "RIGHT",
  lastSuccessfulMoveDirection: null,
  ...overrides,
})

const board = (
  soldiers: SoldierSnapshot[],
  bounds: FullBoardSnapshot["bounds"] = { minX: 0, maxX: 4, minY: 0, maxY: 4 },
): FullBoardSnapshot => ({
  bounds,
  terrainStones: [],
  soldiers,
})

const transitionChronicle = (
  event: ChronicleEvent,
  startBoard: FullBoardSnapshot,
  endBoard: FullBoardSnapshot,
  endOutcome?: Chronicle["snapshots"][number]["outcome"],
): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: {
    matchId: "transition-match",
    seed: "transition-seed",
    arenaVariantId: "arena",
    arenaVariantVersion: "0.1.0",
    strategyRevisionIds: ["bottom-rev", "top-rev"],
    versions: {
      spec: "1.0.0",
      engine: "0.1.0",
      runtimeJs: "0.1.0",
      chronicle: "0.1.0",
      strategyRevision: "0.1.0",
      arenaVariant: "0.1.0",
    },
  },
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { matchId: "transition-match", seed: "transition-seed" },
    },
    event,
  ],
  snapshots: [
    { kind: "MATCH_START", sequence: 0, context: {}, board: startBoard },
    {
      kind: "TERMINAL",
      sequence: 1,
      context: {},
      board: endBoard,
      ...(endOutcome === undefined ? {} : { outcome: endOutcome }),
    },
  ],
})

const expectSnapshotMismatch = (chronicle: Chronicle): void => {
  expect(validateChronicleTransitions(chronicle)).toContainEqual(
    expect.objectContaining({ code: "SNAPSHOT_MISMATCH" }),
  )
}

describe("validateChronicleTransitions", () => {
  it.each([
    {
      name: "MOVE_ADVANCED",
      event: {
        type: "MOVE_ADVANCED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", direction: "RIGHT" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
    },
    {
      name: "PUSH_RESOLVED",
      event: {
        type: "PUSH_RESOLVED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: {
          soldierId: "mover",
          targetSoldierId: "top-target",
          pushedOffBoard: false,
        },
      } satisfies ChronicleEvent,
      start: board([
        soldier("mover"),
        soldier("top-target", { position: { x: 2, y: 1 } }),
      ]),
      contradicted: board([
        soldier("mover"),
        soldier("top-target", { position: { x: 2, y: 1 } }),
      ]),
    },
    {
      name: "SOLDIER_FELL",
      event: {
        type: "SOLDIER_FELL",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", reason: "MOVED_OFF_BOARD" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
    },
    {
      name: "SOLDIER_STONED",
      event: {
        type: "SOLDIER_STONED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", reason: "TURN_TO_STONE" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
    },
    {
      name: "CONTRACTION_RESOLVED",
      event: {
        type: "CONTRACTION_RESOLVED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { bounds: { minX: 1, maxX: 3, minY: 1, maxY: 3 } },
      } satisfies ChronicleEvent,
      start: board([soldier("mover", { position: { x: 0, y: 0 } })]),
      contradicted: board([soldier("mover", { position: { x: 0, y: 0 } })]),
    },
    {
      name: "MATCH_ENDED",
      event: {
        type: "MATCH_ENDED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { type: "DRAW" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
      contradictedOutcome: { type: "WIN", winnerPlayerId: "bottom" } as const,
    },
  ])("rejects provable $name contradictions", (fixture) => {
    expectSnapshotMismatch(
      transitionChronicle(
        fixture.event,
        fixture.start,
        fixture.contradicted,
        fixture.contradictedOutcome,
      ),
    )
  })

  it("does not reject an unstated transition without a later boundary snapshot", () => {
    const start = board([soldier("mover")])
    const chronicle = transitionChronicle(
      {
        type: "MOVE_ADVANCED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", direction: "RIGHT" },
      },
      start,
      start,
    )

    expect(
      validateChronicleTransitions({
        ...chronicle,
        snapshots: chronicle.snapshots.slice(0, 1),
      }),
    ).toEqual([])
  })
})
