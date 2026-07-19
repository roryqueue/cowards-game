import {
  BOTTOM_STARTING_POSITIONS,
  CANONICAL_ARENA_CATALOG_V1_37,
  TOP_STARTING_POSITIONS,
  type BoardBounds,
  type Position,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  CURRENT_MAP_CONFIG_CATALOG,
  MAP_CONFIG_CATALOG_V1_17,
  MAP_CONFIG_CATALOG_V1_19_CANDIDATE,
  curatedArenaVariants,
  openFieldArenaVariant,
  projectCandidateMapConfigCatalogV119,
  resolveCandidateMapConfigCatalogV119,
  resolveCurrentMapConfigCatalog,
  smokeArenaVariant,
  standardCrossArenaVariant,
} from "./index.js"

const containsPosition = (bounds: BoardBounds, position: Position): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

describe("curated arena variants", () => {
  it("preserves the complete historical v1.17 branch byte-for-byte", () => {
    expect(curatedArenaVariants).toEqual([
      {
        id: "arena:smoke:v1",
        name: "Smoke",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
      },
      {
        id: "arena:standard-cross:v1",
        name: "Standard Cross",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [
          { x: 3, y: 2 },
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ],
      },
      {
        id: "arena:open-field:v1",
        name: "Open Field",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
      },
    ])
    expect(curatedArenaVariants).toEqual([
      smokeArenaVariant,
      standardCrossArenaVariant,
      openFieldArenaVariant,
    ])
    expect(MAP_CONFIG_CATALOG_V1_17.arenaVariants).toBe(
      curatedArenaVariants,
    )
    expect(MAP_CONFIG_CATALOG_V1_17.schedulableArenaVariants).toBe(
      curatedArenaVariants,
    )
  })

  it("selects the activated v1.19 catalog without treating Open Field as diversity", () => {
    expect(MAP_CONFIG_CATALOG_V1_19_CANDIDATE.arenaVariants).toEqual(
      curatedArenaVariants,
    )
    expect(
      MAP_CONFIG_CATALOG_V1_19_CANDIDATE.schedulableArenaVariants.map(
        ({ id }) => id,
      ),
    ).toEqual(["arena:smoke:v1", "arena:standard-cross:v1"])
    expect(
      MAP_CONFIG_CATALOG_V1_19_CANDIDATE.authority.arenas.find(
        ({ id }) => id === "arena:open-field:v1",
      ),
    ).toMatchObject({
      status: "historical_alias",
      schedulable: false,
      aliasOf: "arena:smoke:v1",
    })
    expect(Object.isFrozen(MAP_CONFIG_CATALOG_V1_19_CANDIDATE)).toBe(true)
    expect(
      Object.isFrozen(MAP_CONFIG_CATALOG_V1_19_CANDIDATE.arenaVariants),
    ).toBe(true)
    expect(resolveCurrentMapConfigCatalog()).toBe(
      MAP_CONFIG_CATALOG_V1_19_CANDIDATE,
    )
    expect(CURRENT_MAP_CONFIG_CATALOG).toBe(
      MAP_CONFIG_CATALOG_V1_19_CANDIDATE,
    )
  })

  it("requires exact explicit v1.19 dispatch", () => {
    expect(
      resolveCandidateMapConfigCatalogV119({
        semanticAuthorityKey: "runtime-v1.19",
      }),
    ).toBe(MAP_CONFIG_CATALOG_V1_19_CANDIDATE)
    for (const selector of [
      undefined,
      "runtime-v1.19",
      {},
      { semanticAuthorityKey: "runtime-v1.17" },
      {
        semanticAuthorityKey: "runtime-v1.19",
        current: true,
      },
    ]) {
      expect(resolveCandidateMapConfigCatalogV119(selector)).toBeUndefined()
    }
  })

  it("rejects candidate alias, hash, status, and geometry substitutions", () => {
    const mutations = [
      (catalog: typeof CANONICAL_ARENA_CATALOG_V1_37) => {
        catalog.arenas[2]!.aliasOf = "arena:standard-cross:v1"
      },
      (catalog: typeof CANONICAL_ARENA_CATALOG_V1_37) => {
        catalog.arenas[2]!.semanticGeometryHash =
          catalog.arenas[1]!.semanticGeometryHash
      },
      (catalog: typeof CANONICAL_ARENA_CATALOG_V1_37) => {
        catalog.arenas[2]!.status = "active"
      },
      (catalog: typeof CANONICAL_ARENA_CATALOG_V1_37) => {
        catalog.arenas.push({
          ...globalThis.structuredClone(catalog.arenas[0]!),
          id: "arena:unapproved:v1",
        })
      },
    ] as const
    const expectedCodes = [
      "ALIAS_TARGET_MISMATCH",
      "ALIAS_TARGET_MISMATCH",
      "OFFICIAL_CATALOG_MISMATCH",
      "OFFICIAL_CATALOG_MISMATCH",
    ] as const

    for (const [index, mutate] of mutations.entries()) {
      const catalog = globalThis.structuredClone(
        CANONICAL_ARENA_CATALOG_V1_37,
      )
      mutate(catalog)
      expect(() => projectCandidateMapConfigCatalogV119(catalog)).toThrow(
        expectedCodes[index],
      )
    }
  })

  it("contain every canonical starting Soldier position", () => {
    const startingPositions = [
      ...BOTTOM_STARTING_POSITIONS,
      ...TOP_STARTING_POSITIONS,
    ]

    for (const arena of curatedArenaVariants) {
      for (const position of startingPositions) {
        expect(
          containsPosition(arena.initialBounds, position),
          `${arena.id} initial bounds must contain (${position.x}, ${position.y})`,
        ).toBe(true)
      }
    }
  })
})
