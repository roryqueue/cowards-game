import {
  ArenaVariantSchema,
  BOTTOM_STARTING_POSITIONS,
  COMPATIBILITY_VERSIONS,
  ROUND_ACTIVATION_COUNTS,
  TOP_STARTING_POSITIONS,
  semanticIntegrityShapeFailure,
  validateCanonicalArena,
  validateCanonicalInitialGameState,
  type ArenaVariant,
  type BoardBounds,
  type CompatibilityVersions,
  type Direction,
  type Position,
  type SemanticIntegrityResult,
  type Soldier,
} from "@cowards/spec"
import type {
  CreateInitialGameStateInput,
  EnginePlayer,
  GameState,
  PlayerSide,
} from "../types.js"

export type CandidateInitialGameStateResult =
  | { readonly ok: true; readonly state: GameState }
  | {
      readonly ok: false
      readonly failure: Exclude<SemanticIntegrityResult, { ok: true }>
    }

const seedHash = (seed: string): number => {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

export const getInitialInitiativePlayerId = (
  seed: string,
  bottomPlayerId: string,
  topPlayerId: string,
): string => (seedHash(seed) % 2 === 0 ? bottomPlayerId : topPlayerId)

const clonePosition = ({ x, y }: Position): Position => ({ x, y })

const cloneBounds = ({ minX, maxX, minY, maxY }: BoardBounds): BoardBounds => ({
  minX,
  maxX,
  minY,
  maxY,
})

const cloneVersions = (
  versions: CompatibilityVersions,
): CompatibilityVersions =>
  Object.freeze({
    spec: versions.spec,
    engine: versions.engine,
    runtimeJs: versions.runtimeJs,
    chronicle: versions.chronicle,
    strategyRevision: versions.strategyRevision,
    arenaVariant: versions.arenaVariant,
  })

const cloneArena = (arena: ArenaVariant): ArenaVariant => ({
  id: arena.id,
  name: arena.name,
  initialBounds: cloneBounds(arena.initialBounds),
  terrainStones: arena.terrainStones.map(clonePosition),
})

const createPlayer = (
  id: string,
  side: PlayerSide,
  strategyRevisionId: string,
): EnginePlayer => ({
  id,
  side,
  strategyRevisionId,
  strategyMemory: {},
})

const createStartingSoldiers = (
  ownerPlayerId: string,
  side: PlayerSide,
  positions: readonly Readonly<Position>[],
  facing: Direction,
): Soldier[] =>
  positions.map((position, index) => ({
    id: `${side}-soldier-${index + 1}`,
    ownerPlayerId,
    status: "ACTIVE",
    position: clonePosition(position),
    facing,
    lastSuccessfulMoveDirection: null,
    soldierMemory: {},
  }))

export const createCandidateInitialGameState = (
  input: CreateInitialGameStateInput,
): CandidateInitialGameStateResult => {
  const parsedArena = ArenaVariantSchema.safeParse(input.arenaVariant)
  if (!parsedArena.success) {
    const failure = semanticIntegrityShapeFailure("ARENA", ["arenaVariant"])
    if (failure.ok) {
      throw new Error("Arena shape failure unexpectedly validated.")
    }
    return { ok: false, failure }
  }

  const arenaVariant = cloneArena(parsedArena.data)
  const arenaAdmission = validateCanonicalArena(arenaVariant)
  if (!arenaAdmission.ok) {
    return { ok: false, failure: arenaAdmission }
  }
  const bottomPlayer = createPlayer(
    input.bottomPlayerId,
    "bottom",
    input.bottomStrategyRevisionId,
  )
  const topPlayer = createPlayer(
    input.topPlayerId,
    "top",
    input.topStrategyRevisionId,
  )

  const state: GameState = {
    matchId: input.matchId,
    seed: input.seed,
    versions: cloneVersions(COMPATIBILITY_VERSIONS),
    arenaVariant,
    players: [bottomPlayer, topPlayer],
    phase: "ROUND",
    phaseNumber: 1,
    roundNumber: 1,
    activationCount: ROUND_ACTIVATION_COUNTS[1],
    initiativePlayerId: getInitialInitiativePlayerId(
      input.seed,
      input.bottomPlayerId,
      input.topPlayerId,
    ),
    bounds: cloneBounds(arenaVariant.initialBounds),
    soldiers: [
      ...createStartingSoldiers(
        input.bottomPlayerId,
        "bottom",
        BOTTOM_STARTING_POSITIONS,
        "UP",
      ),
      ...createStartingSoldiers(
        input.topPlayerId,
        "top",
        TOP_STARTING_POSITIONS,
        "DOWN",
      ),
    ],
    terrainStones: arenaVariant.terrainStones.map(clonePosition),
  }

  const stateAdmission = validateCanonicalInitialGameState(state)
  return stateAdmission.ok
    ? { ok: true, state }
    : { ok: false, failure: stateAdmission }
}
