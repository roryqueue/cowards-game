import type {
  MatchId,
  MatchSetId,
  PublicMatchSetResultDto,
  PublicReplayMetadataServiceDto,
  PublicStrategyCardDto,
  StrategyId,
} from "@cowards/spec"
import {
  getCurrentPublicReadUser,
  publicReadService,
  type PublicReadUser,
} from "./public-service-adapter.js"

type PublicEntrantDto = PublicMatchSetResultDto["entrants"][number]
type PublicMatchEvidenceDto = PublicMatchSetResultDto["matches"][number]

export type PublicReadEntrantDto = PublicEntrantDto & {
  shortHash: string
  isOwner: boolean
  ownerSourceHref?: string | undefined
}

export type PublicReadMatchLedgerRow = PublicMatchEvidenceDto & {
  bottomLabel: string
  topLabel: string
  replayHref?: string | undefined
}

export interface PublicReadMatchSetResultDto extends Omit<
  PublicMatchSetResultDto,
  "entrants" | "matches"
> {
  currentUser: PublicReadUser | null
  entrants: PublicReadEntrantDto[]
  matches: PublicReadMatchLedgerRow[]
}

const decodePathId = <T extends string>(value: T): T => {
  try {
    return decodeURIComponent(value) as T
  } catch {
    return value
  }
}

const toPublicReadMatchSetResultDto = (
  result: PublicMatchSetResultDto,
  currentUser: PublicReadUser | null,
): PublicReadMatchSetResultDto => {
  const entrantById = new Map(
    result.entrants.map((entrant) => [entrant.entrantId, entrant]),
  )
  const entrants = result.entrants.map((entrant) => {
    const isOwner = currentUser?.id === entrant.ownerUserId
    return {
      ...entrant,
      shortHash: entrant.sourceHash.slice(0, 10),
      isOwner,
      ...(isOwner
        ? {
            ownerSourceHref: `/api/account/revisions/${encodeURIComponent(
              entrant.strategyRevisionId,
            )}/source`,
          }
        : {}),
    }
  })
  const matches = result.matches.map((match) => {
    const bottom = entrantById.get(match.entrants.bottom)
    const top = entrantById.get(match.entrants.top)
    return {
      ...match,
      bottomLabel: bottom?.displayLabel ?? match.entrants.bottom,
      topLabel: top?.displayLabel ?? match.entrants.top,
      ...(match.replayAvailable
        ? { replayHref: `/matches/${encodeURIComponent(match.matchId)}/replay` }
        : {}),
    }
  })
  return {
    ...result,
    currentUser,
    entrants,
    matches,
  }
}

export const getPublicMatchSetResult = async (
  matchSetId: MatchSetId,
): Promise<PublicReadMatchSetResultDto | null> => {
  const [summary, currentUser] = await Promise.all([
    publicReadService.getPublicMatchSetSummary(decodePathId(matchSetId)),
    getCurrentPublicReadUser(),
  ])
  return summary
    ? toPublicReadMatchSetResultDto(summary.result, currentUser)
    : null
}

export const getPublicReplayMetadata = async (
  matchId: MatchId,
): Promise<PublicReplayMetadataServiceDto | null> =>
  publicReadService.getPublicReplayMetadata(decodePathId(matchId))

export const getPublicStrategyCard = async (
  strategyId: StrategyId,
): Promise<PublicStrategyCardDto | null> => {
  const page = await publicReadService.getPublicStrategyPage(
    decodePathId(strategyId),
  )
  return page ? page.payload.strategy : null
}
