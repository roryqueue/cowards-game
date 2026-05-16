import type { ArenaVariant } from "@cowards/spec"

export const mapConfigsPackage = "@cowards/map-configs"

export const smokeArenaVariant: ArenaVariant = {
  id: "arena:smoke:v1",
  name: "Smoke",
  initialBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  terrainStones: [],
}

export const standardCrossArenaVariant: ArenaVariant = {
  id: "arena:standard-cross:v1",
  name: "Standard Cross",
  initialBounds: { minX: 0, maxX: 6, minY: 0, maxY: 6 },
  terrainStones: [
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 4, y: 3 },
    { x: 3, y: 4 },
  ],
}

export const openFieldArenaVariant: ArenaVariant = {
  id: "arena:open-field:v1",
  name: "Open Field",
  initialBounds: { minX: 0, maxX: 8, minY: 0, maxY: 8 },
  terrainStones: [],
}

export const curatedArenaVariants = [
  smokeArenaVariant,
  standardCrossArenaVariant,
  openFieldArenaVariant,
] as const satisfies readonly ArenaVariant[]
