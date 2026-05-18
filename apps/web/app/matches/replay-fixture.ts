import {
  getCanonicalReplayScenario,
  getCanonicalReplayScenarioIds,
  type CanonicalReplayScenarioId,
} from "@cowards/test-utils"
import { createChronicleMetadata } from "@cowards/persistence/chronicle-store"
import type { Chronicle, MatchId } from "@cowards/spec"
import type {
  GetMatchReplayOptions,
  ReplayMetadataDto,
  ReplayPageData,
} from "./types.js"
import { buildReadyReplayFromChronicle } from "./replay-ready.js"

export const replayFixtureMatchId = "match:e2e-replay-fixture"
export const defaultReplayFixtureScenarioId = "compound-tour"

export interface ReplayFixtureDataOptions extends GetMatchReplayOptions {
  scenarioId?: CanonicalReplayScenarioId | undefined
}

export interface ReplayFixtureScenarioCatalogEntry {
  id: CanonicalReplayScenarioId
  replayHref: string
}

export const isReplayFixtureEnabled = (): boolean =>
  process.env.PLAYWRIGHT_TEST === "1" ||
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "development"

const safeDecodeURIComponent = (value: string): string | null => {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

const canonicalScenarioIds = new Set<string>(getCanonicalReplayScenarioIds())

const isCanonicalReplayScenarioId = (
  value: string,
): value is CanonicalReplayScenarioId => canonicalScenarioIds.has(value)

export const getReplayFixtureMatchId = (
  scenarioId: CanonicalReplayScenarioId = defaultReplayFixtureScenarioId,
): MatchId =>
  scenarioId === defaultReplayFixtureScenarioId
    ? replayFixtureMatchId
    : (`${replayFixtureMatchId}:${scenarioId}` as MatchId)

export const getReplayFixtureScenarioId = (
  matchId: string,
): CanonicalReplayScenarioId | null => {
  const decoded = safeDecodeURIComponent(matchId) ?? matchId
  if (decoded === replayFixtureMatchId) {
    return defaultReplayFixtureScenarioId
  }

  const prefix = `${replayFixtureMatchId}:`
  if (!decoded.startsWith(prefix)) {
    return null
  }

  const scenarioId = decoded.slice(prefix.length)
  return isCanonicalReplayScenarioId(scenarioId) ? scenarioId : null
}

export const isReplayFixtureMatch = (matchId: string): boolean =>
  isReplayFixtureEnabled() && getReplayFixtureScenarioId(matchId) !== null

export const createReplayFixtureCatalog =
  (): ReplayFixtureScenarioCatalogEntry[] =>
    getCanonicalReplayScenarioIds().map((id) => ({
      id,
      replayHref: `/matches/${encodeURIComponent(
        getReplayFixtureMatchId(id),
      )}/replay`,
    }))

const replayMetadataFromChronicle = (
  scenarioId: CanonicalReplayScenarioId,
  chronicle: Chronicle,
): ReplayMetadataDto => {
  const metadata = createChronicleMetadata(chronicle)
  return {
    matchId: getReplayFixtureMatchId(scenarioId),
    chronicleId: metadata.id,
    hash: metadata.hash,
    schemaVersion: metadata.schemaVersion,
    eventCount: metadata.eventCount,
    snapshotCount: metadata.snapshotCount,
    outcome: metadata.outcome,
    bottomPlayerId: metadata.bottomPlayerId,
    topPlayerId: metadata.topPlayerId,
    arenaVariantId: metadata.arenaVariantId,
  }
}

export const createReplayFixtureData = (
  options: ReplayFixtureDataOptions = {},
): ReplayPageData => {
  const scenarioId = options.scenarioId ?? defaultReplayFixtureScenarioId
  const scenario = getCanonicalReplayScenario(scenarioId)

  return buildReadyReplayFromChronicle({
    chronicle: scenario.chronicle,
    metadata: replayMetadataFromChronicle(scenarioId, scenario.chronicle),
    options,
  })
}
