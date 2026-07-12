/**
 * Mirrored current-rules baseline over all Advanced Strategy definitions.
 *
 * Run from the repository root:
 *   pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts
 */
import type {
  SoldierBrainInput,
  SoldierBrainResult,
  StrategyInput,
  StrategyResult,
} from "../../../packages/spec/src/index.ts"
import {
  runMatch,
  success,
  violation,
  type StrategyRuntime,
} from "../../../packages/engine/src/index.ts"
import { ADVANCED_STRATEGY_DEFINITIONS } from "../../../packages/persistence/src/advanced-strategies.ts"
import { curatedArenaVariants } from "../../../packages/map-configs/src/index.ts"
import { transpileStrategySource } from "../../../packages/runtime-js/src/transpile.ts"

type LoadedStrategy = {
  selectActivations(input: StrategyInput): StrategyResult
  soldierBrain(input: SoldierBrainInput): SoldierBrainResult
}

const load = (source: string): LoadedStrategy => {
  const transpiled = transpileStrategySource(source)
  if (!transpiled.ok) throw new Error(transpiled.message)
  const exports: Record<string, unknown> = {}
  const strategy = new Function(
    "exports",
    `${transpiled.code}; return exports.default`,
  )(exports) as LoadedStrategy
  return strategy
}

const loaded = new Map(
  ADVANCED_STRATEGY_DEFINITIONS.map((definition) => [
    definition.id,
    load(definition.source),
  ]),
)

const runtimeFor = (
  bottomId: string,
  topId: string,
  bottomStrategyId: string,
  topStrategyId: string,
): StrategyRuntime => ({
  selectActivations(input) {
    const playerId = input.mySoldiers[0]?.ownerPlayerId
    const strategyId =
      playerId === bottomId
        ? bottomStrategyId
        : playerId === topId
          ? topStrategyId
          : undefined
    const strategy = strategyId ? loaded.get(strategyId) : undefined
    if (!strategy) return violation("INVALID_OUTPUT", "Missing strategy")
    try {
      return success(strategy.selectActivations(input))
    } catch (error) {
      return violation("THROWN_EXCEPTION", String(error))
    }
  },
  runSoldierBrain(input) {
    const strategyId =
      input.self.ownerPlayerId === bottomId
        ? bottomStrategyId
        : input.self.ownerPlayerId === topId
          ? topStrategyId
          : undefined
    const strategy = strategyId ? loaded.get(strategyId) : undefined
    if (!strategy) return violation("INVALID_OUTPUT", "Missing strategy")
    try {
      return success(strategy.soldierBrain(input))
    } catch (error) {
      return violation("THROWN_EXCEPTION", String(error))
    }
  },
})

type RecordRow = {
  wins: number
  losses: number
  draws: number
  failures: number
  byArena: Record<string, { wins: number; losses: number; draws: number }>
}

const ids = ADVANCED_STRATEGY_DEFINITIONS.map((definition) => definition.id)
const records = new Map<string, RecordRow>(
  ids.map((id) => [
    id,
    { wins: 0, losses: 0, draws: 0, failures: 0, byArena: {} },
  ]),
)
const matchups: Array<{
  left: string
  right: string
  leftWins: number
  rightWins: number
  draws: number
}> = []

const bump = (
  id: string,
  arenaId: string,
  result: "wins" | "losses" | "draws",
) => {
  const record = records.get(id)!
  record[result] += 1
  record.byArena[arenaId] ??= { wins: 0, losses: 0, draws: 0 }
  record.byArena[arenaId]![result] += 1
}

for (let leftIndex = 0; leftIndex < ids.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < ids.length; rightIndex += 1) {
    const left = ids[leftIndex]!
    const right = ids[rightIndex]!
    const matchup = { left, right, leftWins: 0, rightWins: 0, draws: 0 }
    for (const arena of curatedArenaVariants) {
      for (const seed of ["meta-even", "meta-odd"]) {
        for (const mirrored of [false, true]) {
          const bottomStrategy = mirrored ? right : left
          const topStrategy = mirrored ? left : right
          const bottomPlayerId = `player:${bottomStrategy}:bottom`
          const topPlayerId = `player:${topStrategy}:top`
          const result = runMatch({
            matchId: `matrix:${leftIndex}:${rightIndex}:${arena.id}:${seed}:${mirrored}`,
            seed,
            arenaVariant: arena,
            bottomPlayerId,
            topPlayerId,
            bottomStrategyRevisionId: `revision:${bottomStrategy}`,
            topStrategyRevisionId: `revision:${topStrategy}`,
            runtime: runtimeFor(
              bottomPlayerId,
              topPlayerId,
              bottomStrategy,
              topStrategy,
            ),
          })
          const outcome = result.state.outcome
          if (!outcome || outcome.type === "FAILED") {
            records.get(left)!.failures += 1
            records.get(right)!.failures += 1
            continue
          }
          if (outcome.type === "DRAW") {
            bump(left, arena.id, "draws")
            bump(right, arena.id, "draws")
            matchup.draws += 1
            continue
          }
          const winner =
            outcome.winnerPlayerId === bottomPlayerId
              ? bottomStrategy
              : topStrategy
          const loser = winner === left ? right : left
          bump(winner, arena.id, "wins")
          bump(loser, arena.id, "losses")
          if (winner === left) matchup.leftWins += 1
          else matchup.rightWins += 1
        }
      }
    }
    matchups.push(matchup)
  }
}

const standings = [...records.entries()]
  .map(([id, record]) => ({
    id,
    ...record,
    winRate:
      record.wins / Math.max(1, record.wins + record.losses + record.draws),
  }))
  .sort(
    (left, right) =>
      right.winRate - left.winRate || left.id.localeCompare(right.id),
  )

const decisiveMatchups = matchups
  .map((matchup) => ({
    ...matchup,
    margin: Math.abs(matchup.leftWins - matchup.rightWins),
  }))
  .sort((left, right) => right.margin - left.margin)

const beats = new Set(
  matchups.flatMap((matchup) =>
    matchup.leftWins === matchup.rightWins
      ? []
      : [
          matchup.leftWins > matchup.rightWins
            ? `${matchup.left}>${matchup.right}`
            : `${matchup.right}>${matchup.left}`,
        ],
  ),
)
const nonTransitiveCycles: string[][] = []
for (let first = 0; first < ids.length; first += 1) {
  for (let second = first + 1; second < ids.length; second += 1) {
    for (let third = second + 1; third < ids.length; third += 1) {
      const [a, b, c] = [ids[first]!, ids[second]!, ids[third]!]
      if (
        (beats.has(`${a}>${b}`) &&
          beats.has(`${b}>${c}`) &&
          beats.has(`${c}>${a}`)) ||
        (beats.has(`${a}>${c}`) &&
          beats.has(`${c}>${b}`) &&
          beats.has(`${b}>${a}`))
      ) {
        nonTransitiveCycles.push([a, b, c])
      }
    }
  }
}

console.log(
  JSON.stringify(
    {
      standings,
      decisiveMatchups,
      nonTransitiveCycleCount: nonTransitiveCycles.length,
      nonTransitiveCycleExamples: nonTransitiveCycles.slice(0, 12),
    },
    null,
    2,
  ),
)
