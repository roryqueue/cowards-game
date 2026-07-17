import {
  CANONICAL_ARENA_CATALOG_V1_37,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  INITIAL_BOUNDS,
  parseArenaCatalogV137,
  resolveCurrentSemanticAuthoritySelection,
  type ArenaCatalogV137,
  type ArenaVariant,
} from "@cowards/spec"

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

export const MAP_CONFIG_CATALOG_V1_17 = Object.freeze({
  semanticAuthorityKey: "runtime-v1.17" as const,
  catalogVersion: "semantic-arena-catalog-v1.37-candidate-1" as const,
  arenaVariants: curatedArenaVariants,
  schedulableArenaVariants: curatedArenaVariants,
})

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const projectCandidateMapConfigCatalogV119 = (
  input: unknown,
) => {
  const authority = parseArenaCatalogV137(input) as ArenaCatalogV137
  const arenaVariants = authority.arenas.map(
    ({ id, name, initialBounds, terrainStones }): ArenaVariant => ({
      id,
      name,
      initialBounds: { ...initialBounds },
      terrainStones: terrainStones.map(({ x, y }) => ({ x, y })),
    }),
  )
  const schedulableIds = new Set(
    authority.arenas
      .filter(({ status, schedulable }) => status === "active" && schedulable)
      .map(({ id }) => id),
  )

  return deepFreeze({
    semanticAuthorityKey: "runtime-v1.19" as const,
    catalogVersion: authority.catalogVersion,
    authority,
    arenaVariants,
    schedulableArenaVariants: arenaVariants.filter(({ id }) =>
      schedulableIds.has(id),
    ),
  })
}

export const MAP_CONFIG_CATALOG_V1_19_CANDIDATE =
  projectCandidateMapConfigCatalogV119(CANONICAL_ARENA_CATALOG_V1_37)

export const resolveCandidateMapConfigCatalogV119 = (selector: unknown) => {
  if (!selector || typeof selector !== "object" || Array.isArray(selector)) {
    return undefined
  }
  const record = selector as Record<string, unknown>
  if (
    Object.keys(record).length !== 1 ||
    Object.keys(record)[0] !== "semanticAuthorityKey" ||
    record.semanticAuthorityKey !== "runtime-v1.19"
  ) {
    return undefined
  }
  return MAP_CONFIG_CATALOG_V1_19_CANDIDATE
}

export const resolveCurrentMapConfigCatalog = () => {
  const selection = resolveCurrentSemanticAuthoritySelection({
    semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
  })
  if (!selection) {
    throw new Error("Generated current map-config selection is invalid.")
  }
  if (String(selection.semanticAuthorityKey) === "runtime-v1.17") {
    return MAP_CONFIG_CATALOG_V1_17
  }
  if (String(selection.semanticAuthorityKey) === "runtime-v1.19") {
    return MAP_CONFIG_CATALOG_V1_19_CANDIDATE
  }
  throw new Error("Unsupported current map-config semantic authority.")
}

export const CURRENT_MAP_CONFIG_CATALOG = resolveCurrentMapConfigCatalog()
