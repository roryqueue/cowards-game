import { INITIAL_BOUNDS, type ArenaVariant } from "@cowards/spec"

export const mapConfigsPackage = "@cowards/map-configs"

export const smokeArenaVariant: ArenaVariant = {
  id: "arena:smoke:v1",
  name: "Smoke",
  initialBounds: INITIAL_BOUNDS,
  terrainStones: [],
}

export const standardCrossArenaVariant: ArenaVariant = {
  id: "arena:standard-cross:v1",
  name: "Standard Cross",
  initialBounds: INITIAL_BOUNDS,
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
  initialBounds: INITIAL_BOUNDS,
  terrainStones: [],
}

export const curatedArenaVariants = [
  smokeArenaVariant,
  standardCrossArenaVariant,
  openFieldArenaVariant,
] as const satisfies readonly ArenaVariant[]
