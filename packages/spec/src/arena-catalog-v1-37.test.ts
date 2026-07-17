import { describe, expect, it } from "vitest"
import {
  ARENA_CATALOG_VERSION_V1_37,
  ARENA_SEMANTIC_GEOMETRY_PROFILE_V1,
  CANONICAL_ARENA_CATALOG_V1_37,
  deriveArenaSemanticGeometryHashV137,
  parseArenaCatalogV137,
  serializeArenaSemanticGeometryPreimageV137,
  type ArenaCatalogV137,
} from "./arena-catalog-v1-37.js"

const clone = <T>(value: T): T => globalThis.structuredClone(value)

describe("canonical arena catalog v1.37", () => {
  it("freezes exactly the existing official arena records", () => {
    expect(ARENA_CATALOG_VERSION_V1_37).toBe(
      "canonical-arena-catalog-v1.37",
    )
    expect(ARENA_SEMANTIC_GEOMETRY_PROFILE_V1).toBe(
      "arena-semantic-geometry-v1",
    )
    expect(CANONICAL_ARENA_CATALOG_V1_37.arenas).toHaveLength(3)
    expect(
      CANONICAL_ARENA_CATALOG_V1_37.arenas.map((arena) => ({
        id: arena.id,
        status: arena.status,
        schedulable: arena.schedulable,
        aliasOf: arena.aliasOf,
      })),
    ).toEqual([
      {
        id: "arena:smoke:v1",
        status: "active",
        schedulable: true,
        aliasOf: undefined,
      },
      {
        id: "arena:standard-cross:v1",
        status: "active",
        schedulable: true,
        aliasOf: undefined,
      },
      {
        id: "arena:open-field:v1",
        status: "historical_alias",
        schedulable: false,
        aliasOf: "arena:smoke:v1",
      },
    ])
    expect(Object.isFrozen(CANONICAL_ARENA_CATALOG_V1_37)).toBe(true)
    expect(Object.isFrozen(CANONICAL_ARENA_CATALOG_V1_37.arenas)).toBe(true)
  })

  it("gives Smoke and Open Field one semantic geometry identity", () => {
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!
    const openField = CANONICAL_ARENA_CATALOG_V1_37.arenas[2]!
    expect(smoke.semanticGeometryHash).toBe(
      openField.semanticGeometryHash,
    )
    expect(smoke.semanticGeometryHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("preserves the released Standard Cross bounds and Y-then-X terrain", () => {
    const standardCross = CANONICAL_ARENA_CATALOG_V1_37.arenas[1]!
    expect(standardCross.initialBounds).toEqual({
      minX: 0,
      maxX: 11,
      minY: 0,
      maxY: 11,
    })
    expect(standardCross.terrainStones).toEqual([
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
    ])
  })

  it("hashes only the canonical semantic geometry preimage", () => {
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!
    const sameGeometryWithNonsemanticMetadata = {
      initialBounds: smoke.initialBounds,
      terrainStones: smoke.terrainStones,
      arenaOwnedSetup: smoke.arenaOwnedSetup,
      id: "arena:renamed:v99",
      name: "Marketing Label",
      description: "not semantic",
      displayOrder: 999,
    }
    expect(
      deriveArenaSemanticGeometryHashV137(
        sameGeometryWithNonsemanticMetadata,
      ),
    ).toBe(smoke.semanticGeometryHash)
    expect(
      new TextDecoder().decode(
        serializeArenaSemanticGeometryPreimageV137(
          sameGeometryWithNonsemanticMetadata,
        ),
      ),
    ).toBe(
      '{"arenaOwnedSetup":{},"hashProfileVersion":"arena-semantic-geometry-v1","initialBounds":{"maxX":11,"maxY":11,"minX":0,"minY":0},"terrainStones":[]}',
    )
  })

  it.each([
    [
      "unsorted terrain",
      (catalog: ArenaCatalogV137) => {
        catalog.arenas[1]!.terrainStones = [
          { x: 2, y: 3 },
          { x: 3, y: 2 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ]
      },
      "NON_CANONICAL_TERRAIN_ORDER",
    ],
    [
      "duplicate terrain",
      (catalog: ArenaCatalogV137) => {
        catalog.arenas[1]!.terrainStones = [
          { x: 3, y: 2 },
          { x: 3, y: 2 },
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ]
      },
      "DUPLICATE_TERRAIN",
    ],
    [
      "out-of-bounds terrain",
      (catalog: ArenaCatalogV137) => {
        catalog.arenas[1]!.terrainStones = [
          { x: 3, y: 2 },
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
          { x: 12, y: 12 },
        ]
      },
      "TERRAIN_OUT_OF_BOUNDS",
    ],
  ] as const)("rejects %s", (_label, mutate, code) => {
    const catalog = clone(CANONICAL_ARENA_CATALOG_V1_37)
    mutate(catalog)
    expect(() => parseArenaCatalogV137(catalog)).toThrow(code)
  })

  it("rejects alias hash/geometry substitution and schedulable aliases", () => {
    const changedHash = clone(CANONICAL_ARENA_CATALOG_V1_37)
    changedHash.arenas[2]!.semanticGeometryHash =
      changedHash.arenas[1]!.semanticGeometryHash
    expect(() => parseArenaCatalogV137(changedHash)).toThrow(
      "ALIAS_TARGET_MISMATCH",
    )

    const schedulableAlias = clone(CANONICAL_ARENA_CATALOG_V1_37)
    schedulableAlias.arenas[2]!.schedulable = true
    expect(() => parseArenaCatalogV137(schedulableAlias)).toThrow(
      "OFFICIAL_CATALOG_MISMATCH",
    )
  })

  it("rejects duplicate active semantic geometry", () => {
    const catalog = clone(CANONICAL_ARENA_CATALOG_V1_37)
    catalog.arenas[1]!.terrainStones = []
    catalog.arenas[1]!.semanticGeometryHash =
      catalog.arenas[0]!.semanticGeometryHash
    expect(() => parseArenaCatalogV137(catalog)).toThrow(
      "ACTIVE_SEMANTIC_GEOMETRY_DUPLICATE",
    )
  })

  it("rejects changed Standard Cross geometry and added official geometry", () => {
    const changed = clone(CANONICAL_ARENA_CATALOG_V1_37)
    changed.arenas[1]!.terrainStones = [{ x: 5, y: 5 }]
    changed.arenas[1]!.semanticGeometryHash =
      deriveArenaSemanticGeometryHashV137(changed.arenas[1]!)
    expect(() => parseArenaCatalogV137(changed)).toThrow(
      "OFFICIAL_CATALOG_MISMATCH",
    )

    const added = clone(CANONICAL_ARENA_CATALOG_V1_37)
    added.arenas.push({
      ...clone(added.arenas[0]!),
      id: "arena:new:v1",
      name: "Unapproved Geometry",
    })
    expect(() => parseArenaCatalogV137(added)).toThrow(
      "OFFICIAL_CATALOG_MISMATCH",
    )
  })
})
