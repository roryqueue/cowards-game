import type { FullBoardSnapshot } from "@cowards/spec"
import type { ReplayReadyDto, ReplayTimelineEntryDto } from "../../types.js"
import { describe, expect, it } from "vitest"
import {
  buildReplayBoardModel,
  getEventCalloutDescriptor,
  ReplayBoardColors,
} from "./replay-board-model.js"

const board: FullBoardSnapshot = {
  bounds: { minX: 1, maxX: 10, minY: 1, maxY: 10 },
  terrainStones: [{ x: 4, y: 4 }],
  soldiers: [
    {
      id: "soldier:bottom:1",
      ownerPlayerId: "player:bottom",
      status: "ACTIVE",
      position: { x: 2, y: 9 },
      facing: "UP",
      lastSuccessfulMoveDirection: "UP",
    },
    {
      id: "soldier:bottom:2",
      ownerPlayerId: "player:bottom",
      status: "FALLEN",
      position: null,
      facing: null,
      lastSuccessfulMoveDirection: "LEFT",
    },
    {
      id: "soldier:top:1",
      ownerPlayerId: "player:top",
      status: "STONE",
      position: { x: 6, y: 3 },
      facing: "DOWN",
      lastSuccessfulMoveDirection: "DOWN",
    },
  ],
}

const entry = (
  type: ReplayTimelineEntryDto["type"],
  sequence = 1,
): ReplayTimelineEntryDto => ({
  sequence,
  type,
  label: type,
  privacy: "public",
  context: {},
  payload: {},
})

const data: ReplayReadyDto = {
  status: "ready",
  mode: "public",
  metadata: {
    matchId: "match:board",
    chronicleId: "chronicle:board",
    hash: "hash",
    schemaVersion: "chronicle-v1",
    eventCount: 2,
    snapshotCount: 1,
    outcome: { type: "DRAW" },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    arenaVariantId: "arena:board",
  },
  projection: {
    schemaVersion: "chronicle-v1",
    viewer: { access: "public" },
    reproducibility: {
      matchId: "match:board",
      seed: "seed",
      arenaVariantId: "arena:board",
      arenaVariantVersion: "arena-variant-v1",
      strategyRevisionIds: ["revision:bottom", "revision:top"],
      versions: {
        spec: "spec-v1",
        engine: "engine-v1",
        runtimeJs: "runtime-js-v1",
        chronicle: "chronicle-v1",
        strategyRevision: "strategy-revision-v1",
        arenaVariant: "arena-variant-v1",
      },
    },
    events: [],
    snapshots: [],
  },
  timeline: [entry("MATCH_STARTED", 0), entry("CONTRACTION_RESOLVED", 1)],
  states: [
    { sequence: 0, board },
    { sequence: 1, board },
  ],
  initialSequence: 0,
}

describe("replay board model", () => {
  it("describes active, stone, fallen, terrain, bounds, and contraction distinctly", () => {
    const model = buildReplayBoardModel(data, 1, "soldier:bottom:1")

    expect(model.bounds.contractionActive).toBe(true)
    expect(model.bounds.contractionStroke).toBe(ReplayBoardColors.terrain)
    expect(model.terrain[0]).toMatchObject({
      fill: ReplayBoardColors.terrain,
      shape: "terrain-square",
      texture: "hatched",
    })
    expect(
      model.soldiers.find((soldier) => soldier.status === "ACTIVE"),
    ).toMatchObject({
      fill: ReplayBoardColors.ownerBottom,
      shape: "active-circle",
      texture: "solid",
      selected: true,
    })
    expect(
      model.soldiers.find((soldier) => soldier.status === "STONE"),
    ).toMatchObject({
      fill: ReplayBoardColors.stone,
      shape: "stone-diamond",
      texture: "cracked",
    })
    expect(
      model.soldiers.find((soldier) => soldier.status === "FALLEN"),
    ).toMatchObject({
      position: null,
      shape: "fallen-x",
      texture: "absent",
    })
  })

  it("keeps owner badge numbers stable within each owner", () => {
    const model = buildReplayBoardModel(data, 0, null)

    expect(
      model.soldiers
        .filter((soldier) => soldier.owner === "player:bottom")
        .map((soldier) => soldier.badgeNumber),
    ).toEqual([1, 2])
    expect(
      model.soldiers
        .filter((soldier) => soldier.owner === "player:top")
        .map((soldier) => soldier.badgeNumber),
    ).toEqual([1])
  })

  it("maps major event callouts to the UI contract colors", () => {
    expect(getEventCalloutDescriptor(entry("BACKSTAB_RESOLVED"))).toMatchObject(
      { variant: "backstab", color: "#d1403f" },
    )
    expect(getEventCalloutDescriptor(entry("PUSH_RESOLVED"))).toMatchObject({
      variant: "push",
      color: "#b8872c",
    })
    expect(getEventCalloutDescriptor(entry("SOLDIER_FELL"))).toMatchObject({
      variant: "fall",
      color: "#6e5acb",
    })
    expect(getEventCalloutDescriptor(entry("RUNTIME_VIOLATION"))).toMatchObject(
      { variant: "runtime-violation", color: "#b42318" },
    )
  })
})
