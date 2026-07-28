import { z } from "zod"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import type { BoardBounds, JsonValue, Position } from "./types.js"

export const ARENA_CATALOG_VERSION_V1_37 =
  "canonical-arena-catalog-v1.37" as const
export const ARENA_SEMANTIC_GEOMETRY_PROFILE_V1 =
  "arena-semantic-geometry-v1" as const

const ARENA_SEMANTIC_GEOMETRY_DOMAIN_V1 =
  "cowards-game:arena-semantic-geometry:v1" as const
const textEncoder = new TextEncoder()

export type ArenaCatalogStatusV137 = "active" | "historical_alias"

export interface ArenaGeometrySourceV137 {
  initialBounds: BoardBounds
  terrainStones: Position[]
  arenaOwnedSetup: Record<string, never>
}

export interface ArenaCatalogRecordV137 extends ArenaGeometrySourceV137 {
  id: string
  version: "v1"
  name: string
  status: ArenaCatalogStatusV137
  schedulable: boolean
  aliasOf?: string | undefined
  semanticGeometryHash: `sha256:${string}`
}

export interface ArenaCatalogV137 {
  schemaVersion: "canonical-arena-catalog-v1.37-manifest-v1"
  catalogVersion: typeof ARENA_CATALOG_VERSION_V1_37
  geometryHashProfile: typeof ARENA_SEMANTIC_GEOMETRY_PROFILE_V1
  arenas: ArenaCatalogRecordV137[]
}

export class ArenaCatalogV137Error extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = "ArenaCatalogV137Error"
    this.code = code
  }
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const PositionV137Schema = z
  .object({ x: z.number().int(), y: z.number().int() })
  .strict()
const BoundsV137Schema = z
  .object({
    minX: z.number().int(),
    maxX: z.number().int(),
    minY: z.number().int(),
    maxY: z.number().int(),
  })
  .strict()
const EmptyArenaOwnedSetupV137Schema = z.object({}).strict()
const Sha256V137Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u)

const ArenaCatalogRecordV137Schema = z
  .object({
    id: z.string().min(1),
    version: z.literal("v1"),
    name: z.string().min(1),
    status: z.enum(["active", "historical_alias"]),
    schedulable: z.boolean(),
    aliasOf: z.string().min(1).optional(),
    initialBounds: BoundsV137Schema,
    terrainStones: z.array(PositionV137Schema),
    arenaOwnedSetup: EmptyArenaOwnedSetupV137Schema,
    semanticGeometryHash: Sha256V137Schema,
  })
  .strict()

const ArenaCatalogV137Schema = z
  .object({
    schemaVersion: z.literal("canonical-arena-catalog-v1.37-manifest-v1"),
    catalogVersion: z.literal(ARENA_CATALOG_VERSION_V1_37),
    geometryHashProfile: z.literal(ARENA_SEMANTIC_GEOMETRY_PROFILE_V1),
    arenas: z.array(ArenaCatalogRecordV137Schema),
  })
  .strict()

const comparePositionYThenX = (left: Position, right: Position): number =>
  left.y - right.y || left.x - right.x

const validateGeometry = (geometry: ArenaGeometrySourceV137): void => {
  const bounds = BoundsV137Schema.safeParse(geometry.initialBounds)
  if (
    !bounds.success ||
    bounds.data.minX > bounds.data.maxX ||
    bounds.data.minY > bounds.data.maxY
  ) {
    throw new ArenaCatalogV137Error("INVALID_GEOMETRY_BOUNDS")
  }
  if (!EmptyArenaOwnedSetupV137Schema.safeParse(geometry.arenaOwnedSetup).success) {
    throw new ArenaCatalogV137Error("INVALID_ARENA_OWNED_SETUP")
  }

  const seen = new Set<string>()
  for (let index = 0; index < geometry.terrainStones.length; index += 1) {
    const position = PositionV137Schema.safeParse(geometry.terrainStones[index])
    if (!position.success) {
      throw new ArenaCatalogV137Error("INVALID_TERRAIN_POSITION")
    }
    const key = `${position.data.x},${position.data.y}`
    if (seen.has(key)) {
      throw new ArenaCatalogV137Error("DUPLICATE_TERRAIN")
    }
    seen.add(key)
    if (
      position.data.x < bounds.data.minX ||
      position.data.x > bounds.data.maxX ||
      position.data.y < bounds.data.minY ||
      position.data.y > bounds.data.maxY
    ) {
      throw new ArenaCatalogV137Error("TERRAIN_OUT_OF_BOUNDS")
    }
    if (
      index > 0 &&
      comparePositionYThenX(
        geometry.terrainStones[index - 1]!,
        position.data,
      ) >= 0
    ) {
      throw new ArenaCatalogV137Error("NON_CANONICAL_TERRAIN_ORDER")
    }
  }
}

const geometryPreimage = (
  geometry: ArenaGeometrySourceV137,
): JsonValue => {
  validateGeometry(geometry)
  return {
    hashProfileVersion: ARENA_SEMANTIC_GEOMETRY_PROFILE_V1,
    initialBounds: {
      minX: geometry.initialBounds.minX,
      maxX: geometry.initialBounds.maxX,
      minY: geometry.initialBounds.minY,
      maxY: geometry.initialBounds.maxY,
    },
    terrainStones: geometry.terrainStones.map(({ x, y }) => ({ x, y })),
    arenaOwnedSetup: {},
  }
}

export const serializeArenaSemanticGeometryPreimageV137 = (
  geometry: ArenaGeometrySourceV137,
): Uint8Array => {
  const encoded = encodeCanonicalJson(geometryPreimage(geometry), {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new ArenaCatalogV137Error(
      `GEOMETRY_CANONICAL_ENCODING_${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

export const deriveArenaSemanticGeometryHashV137 = (
  geometry: ArenaGeometrySourceV137,
): `sha256:${string}` =>
  `sha256:${hashCanonicalIdentity("semanticTuple", [
    textEncoder.encode(ARENA_SEMANTIC_GEOMETRY_DOMAIN_V1),
    serializeArenaSemanticGeometryPreimageV137(geometry),
  ])}`

const INITIAL_BOUNDS_V1: BoardBounds = {
  minX: 0,
  maxX: 11,
  minY: 0,
  maxY: 11,
}
const EMPTY_GEOMETRY_V1: ArenaGeometrySourceV137 = {
  initialBounds: { ...INITIAL_BOUNDS_V1 },
  terrainStones: [],
  arenaOwnedSetup: {},
}
const STANDARD_CROSS_GEOMETRY_V1: ArenaGeometrySourceV137 = {
  initialBounds: { ...INITIAL_BOUNDS_V1 },
  terrainStones: [
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 4, y: 3 },
    { x: 3, y: 4 },
  ],
  arenaOwnedSetup: {},
}

const OFFICIAL_ARENA_CATALOG_V1_37: ArenaCatalogV137 = {
  schemaVersion: "canonical-arena-catalog-v1.37-manifest-v1",
  catalogVersion: ARENA_CATALOG_VERSION_V1_37,
  geometryHashProfile: ARENA_SEMANTIC_GEOMETRY_PROFILE_V1,
  arenas: [
    {
      id: "arena:smoke:v1",
      version: "v1",
      name: "Smoke",
      status: "active",
      schedulable: true,
      initialBounds: { ...EMPTY_GEOMETRY_V1.initialBounds },
      terrainStones: [],
      arenaOwnedSetup: {},
      semanticGeometryHash:
        deriveArenaSemanticGeometryHashV137(EMPTY_GEOMETRY_V1),
    },
    {
      id: "arena:standard-cross:v1",
      version: "v1",
      name: "Standard Cross",
      status: "active",
      schedulable: true,
      initialBounds: { ...STANDARD_CROSS_GEOMETRY_V1.initialBounds },
      terrainStones: STANDARD_CROSS_GEOMETRY_V1.terrainStones.map((value) => ({
        ...value,
      })),
      arenaOwnedSetup: {},
      semanticGeometryHash: deriveArenaSemanticGeometryHashV137(
        STANDARD_CROSS_GEOMETRY_V1,
      ),
    },
    {
      id: "arena:open-field:v1",
      version: "v1",
      name: "Open Field",
      status: "historical_alias",
      schedulable: false,
      aliasOf: "arena:smoke:v1",
      initialBounds: { ...EMPTY_GEOMETRY_V1.initialBounds },
      terrainStones: [],
      arenaOwnedSetup: {},
      semanticGeometryHash:
        deriveArenaSemanticGeometryHashV137(EMPTY_GEOMETRY_V1),
    },
  ],
}

const canonicalCatalogBytes = (catalog: ArenaCatalogV137): Uint8Array => {
  const encoded = encodeCanonicalJson(catalog as unknown as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new ArenaCatalogV137Error("INVALID_CATALOG_CANONICAL_ENCODING")
  }
  return encoded.bytes
}

const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  left.byteLength === right.byteLength &&
  left.every((value, index) => value === right[index])

export const parseArenaCatalogV137 = (
  input: unknown,
): ArenaCatalogV137 => {
  const parsed = ArenaCatalogV137Schema.safeParse(input)
  if (!parsed.success) {
    throw new ArenaCatalogV137Error("INVALID_CATALOG_SHAPE")
  }
  const catalog = parsed.data as ArenaCatalogV137
  const officialIds = OFFICIAL_ARENA_CATALOG_V1_37.arenas.map(({ id }) => id)
  if (
    catalog.arenas.length !== officialIds.length ||
    catalog.arenas.some(({ id }) => !officialIds.includes(id))
  ) {
    throw new ArenaCatalogV137Error("OFFICIAL_CATALOG_MISMATCH")
  }

  const byId = new Map(catalog.arenas.map((arena) => [arena.id, arena]))
  for (const arena of catalog.arenas) {
    validateGeometry(arena)
    if (arena.status === "historical_alias") {
      const target = arena.aliasOf ? byId.get(arena.aliasOf) : undefined
      if (
        !target ||
        target.status !== "active" ||
        arena.semanticGeometryHash !== target.semanticGeometryHash
      ) {
        throw new ArenaCatalogV137Error("ALIAS_TARGET_MISMATCH")
      }
    }
    if (
      arena.semanticGeometryHash !== deriveArenaSemanticGeometryHashV137(arena)
    ) {
      throw new ArenaCatalogV137Error("SEMANTIC_GEOMETRY_HASH_MISMATCH")
    }
  }

  const activeHashes = new Set<string>()
  for (const arena of catalog.arenas) {
    if (arena.status !== "active" || !arena.schedulable) continue
    if (activeHashes.has(arena.semanticGeometryHash)) {
      throw new ArenaCatalogV137Error(
        "ACTIVE_SEMANTIC_GEOMETRY_DUPLICATE",
      )
    }
    activeHashes.add(arena.semanticGeometryHash)
  }

  if (
    !bytesEqual(
      canonicalCatalogBytes(catalog),
      canonicalCatalogBytes(OFFICIAL_ARENA_CATALOG_V1_37),
    )
  ) {
    throw new ArenaCatalogV137Error("OFFICIAL_CATALOG_MISMATCH")
  }

  return deepFreeze(globalThis.structuredClone(catalog)) as ArenaCatalogV137
}

export const CANONICAL_ARENA_CATALOG_V1_37: ArenaCatalogV137 = deepFreeze(
  globalThis.structuredClone(OFFICIAL_ARENA_CATALOG_V1_37),
) as ArenaCatalogV137
