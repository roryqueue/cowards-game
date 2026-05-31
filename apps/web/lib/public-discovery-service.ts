import {
  COMPETITION_PRESETS,
  SignedInCompetitionEntryDashboardDtoSchema,
  PublicCompetitionDetailDtoSchema,
  PublicCompetitionIndexDtoSchema,
  PublicHomeDiscoveryDtoSchema,
  PublicWatchIndexDtoSchema,
  assertPublicDiscoveryDtoLeakSafe,
  publicDiscoveryBoundary,
  type CompetitionPreset,
  type PublicCompetitionDetailDto,
  type PublicCompetitionIndexDto,
  type PublicDiscoveryCompetitionCard,
  type PublicDiscoveryMatchSetCard,
  type PublicHomeDiscoveryDto,
  type PublicTrialLadderSeasonDto,
  type PublicWatchIndexDto,
  type SignedInCompetitionEntryDashboardDto,
} from "@cowards/spec"
import {
  getCurrentAccountReadUser,
  listAccountReadRevisions,
  type AccountReadUser,
  type AccountReadRevisionSummary,
} from "./account-service-boundary.js"
import { CompetitiveInputError } from "./competitive-errors.js"
import { isGoBackendServiceUnavailableError } from "./go-backend-service-client.js"
import { isMatchExecutionFixtureEnabled } from "./match-execution-fixture-adapter.js"
import {
  getPublicLadderSeason,
  getPublicMatchSetResult,
  type PublicReadMatchSetResultDto,
} from "./public-service-boundary.js"
import { runtimeExhibitionStatusLabel } from "./runtime-labels.js"

const fixtureDiscoveryMatchSetIds = [
  "match-set:fixture:public-safe-replay",
  "match-set:fixture:complete",
  "match-set:fixture:running",
  "match-set:fixture:queued",
  "match-set:fixture:strategy-failure",
  "match-set:fixture:missing-chronicle",
  "match-set:fixture:no-result",
] as const

const learnLinks = [
  { label: "Rules and terms", href: "/learn#rules" },
  { label: "Replay and result trust", href: "/learn#trust" },
  { label: "Competition formats", href: "/learn#competitions" },
] as const

export interface PublicDiscoveryServiceDeps {
  env?: PublicDiscoveryEnv | undefined
  getMatchSetResult?:
    | ((matchSetId: string) => Promise<PublicReadMatchSetResultDto | null>)
    | undefined
  getLadderSeason?:
    | ((seasonId: string) => Promise<PublicTrialLadderSeasonDto | null>)
    | undefined
  getCurrentUser?: typeof getCurrentAccountReadUser | undefined
  listRevisions?: typeof listAccountReadRevisions | undefined
}

export type PublicDiscoveryEnv = Record<string, string | undefined>

const assertDiscovery = <T>(value: T): T => {
  assertPublicDiscoveryDtoLeakSafe(value)
  return value
}

const encode = (value: string): string => encodeURIComponent(value)

const decodePathId = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const competitionIdForPreset = (presetId: string): string =>
  `exhibition:${presetId}`

const competitionHref = (competitionId: string): string =>
  `/competitions/${encode(competitionId)}`

const competitionEnterHref = (competitionId: string): string =>
  `${competitionHref(competitionId)}/enter`

const statusLabel = (status: PublicDiscoveryMatchSetCard["status"]): string => {
  switch (status) {
    case "accepted":
      return "Accepted"
    case "queued":
      return "Queued"
    case "running":
      return "Running"
    case "complete":
      return "Complete"
    case "degraded":
      return "Degraded"
    case "failed":
      return "Failed"
    default:
      return "Unavailable"
  }
}

const toMatchSetCard = (
  result: PublicReadMatchSetResultDto,
): PublicDiscoveryMatchSetCard => {
  const replayReady = result.matches.filter((match) => match.replayHref).length
  const firstReplayHref = result.matches.find(
    (match) => match.replayHref,
  )?.replayHref
  const entrantLabels = result.entrants.map(
    (entrant) => entrant.displayLabel || `@${entrant.ownerHandle}`,
  )
  const lifecycleEvidence =
    result.lifecycle.replayAvailability === "available"
      ? "Replay-ready Chronicle evidence"
      : `${result.lifecycle.resultAvailability} result / ${result.lifecycle.replayAvailability} replay`

  return {
    matchSetId: result.matchSetId,
    title: result.preset.label,
    status: result.status,
    statusLabel: statusLabel(result.status),
    evidenceLabel: lifecycleEvidence,
    resultHref: `/matchsets/${encode(result.matchSetId)}`,
    ...(firstReplayHref ? { replayHref: firstReplayHref } : {}),
    replayReadyCount: replayReady,
    matchCount: result.matches.length,
    entrantLabels,
    origin: "fixture-public-read",
    presetId: result.preset.id,
  }
}

const toPresetCompetitionCard = (
  preset: CompetitionPreset,
): PublicDiscoveryCompetitionCard => {
  const competitionId = competitionIdForPreset(preset.id)
  return {
    competitionId,
    title: preset.label,
    kind: "exhibition",
    status: "open",
    statusLabel: "Open for signed-in entry",
    href: competitionHref(competitionId),
    enterHref: competitionEnterHref(competitionId),
    description:
      preset.id === "smoke-exhibition-v1"
        ? "Fast public mirrored pairwise MatchSet for quick evidence."
        : "Broader public mirrored pairwise MatchSet for stronger replay coverage.",
    entrantCount: 0,
    matchSetCount: 0,
    origin: "competition-preset",
  }
}

const toLadderCompetitionCard = (
  ladder: PublicTrialLadderSeasonDto,
): PublicDiscoveryCompetitionCard => {
  const competitionId = `ladder:${ladder.seasonId}`
  return {
    competitionId,
    title: ladder.name,
    kind: "ladder",
    status:
      ladder.status === "completed" || ladder.status === "archived"
        ? "complete"
        : ladder.status === "active"
          ? "active"
          : ladder.status === "open" || ladder.status === "scheduling"
            ? "open"
            : "unavailable",
    statusLabel: ladder.statusLabel,
    href: competitionHref(competitionId),
    ...(ladder.description ? { description: ladder.description } : {}),
    entrantCount: ladder.entries.length,
    matchSetCount: ladder.matchSets.length,
    origin: "configured-public-read",
  }
}

const configuredLadderSeasonIds = (env: PublicDiscoveryEnv): string[] =>
  (env.COWARDS_PUBLIC_DISCOVERY_LADDER_SEASON_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

const fetchFixtureMatchSets = async (
  getMatchSetResult: (
    matchSetId: string,
  ) => Promise<PublicReadMatchSetResultDto | null>,
  env: PublicDiscoveryEnv,
): Promise<PublicDiscoveryMatchSetCard[]> => {
  if (!isMatchExecutionFixtureEnabled(env)) {
    return []
  }

  const results = await Promise.all(
    fixtureDiscoveryMatchSetIds.map((matchSetId) =>
      getMatchSetResult(matchSetId),
    ),
  )
  return results.flatMap((result) => (result ? [toMatchSetCard(result)] : []))
}

const fetchConfiguredLadders = async (
  getLadderSeason: (
    seasonId: string,
  ) => Promise<PublicTrialLadderSeasonDto | null>,
  env: PublicDiscoveryEnv,
): Promise<PublicTrialLadderSeasonDto[]> => {
  const seasonIds = configuredLadderSeasonIds(env)
  if (!seasonIds.length) {
    return []
  }
  const seasons = await Promise.allSettled(
    seasonIds.map((seasonId) => getLadderSeason(seasonId)),
  )
  return seasons.flatMap((season) =>
    season.status === "fulfilled" && season.value ? [season.value] : [],
  )
}

const parseCompetitionId = (
  rawCompetitionId: string,
):
  | { kind: "exhibition"; presetId: CompetitionPreset["id"] }
  | { kind: "ladder"; seasonId: string }
  | null => {
  const competitionId = decodePathId(rawCompetitionId)
  if (competitionId.startsWith("exhibition:")) {
    const presetId = competitionId.slice("exhibition:".length)
    const preset = COMPETITION_PRESETS.find(
      (candidate) => candidate.id === presetId,
    )
    return preset ? { kind: "exhibition", presetId: preset.id } : null
  }
  if (competitionId.startsWith("ladder:")) {
    return { kind: "ladder", seasonId: competitionId.slice("ladder:".length) }
  }
  return null
}

const revisionRuntimeLabel = (revision: AccountReadRevisionSummary): string =>
  runtimeExhibitionStatusLabel(revision.runtimeSemantics)

export const createPublicDiscoveryService = (
  options: PublicDiscoveryServiceDeps = {},
) => {
  const env = options.env ?? process.env
  const deps = {
    getMatchSetResult: options.getMatchSetResult ?? getPublicMatchSetResult,
    getLadderSeason: options.getLadderSeason ?? getPublicLadderSeason,
    getCurrentUser: options.getCurrentUser ?? getCurrentAccountReadUser,
    listRevisions: options.listRevisions ?? listAccountReadRevisions,
  }

  const getPublicCompetitionIndex =
    async (): Promise<PublicCompetitionIndexDto> => {
      const [ladders] = await Promise.all([
        fetchConfiguredLadders(deps.getLadderSeason, env),
      ])
      const presetCards = COMPETITION_PRESETS.map(toPresetCompetitionCard)
      const ladderCards = ladders.map(toLadderCompetitionCard)
      const activeCompetitions = [...presetCards, ...ladderCards].filter(
        (competition) =>
          competition.status === "open" ||
          competition.status === "active" ||
          competition.status === "running",
      )
      const completedCompetitions = ladderCards.filter(
        (competition) => competition.status === "complete",
      )
      const dto = PublicCompetitionIndexDtoSchema.parse({
        kind: "publicCompetitionIndex",
        boundary: publicDiscoveryBoundary(),
        activeCompetitions,
        entryOpportunities: presetCards,
        completedCompetitions,
        emptyStates: ladderCards.length
          ? []
          : [
              "No public ladder or tournament index is configured yet; exhibitions are available as the current entry path.",
            ],
      })
      return assertDiscovery(dto)
    }

  const getPublicWatchIndex = async (): Promise<PublicWatchIndexDto> => {
    const cards = await fetchFixtureMatchSets(deps.getMatchSetResult, env)
    const replayReady = cards.filter((card) => card.replayReadyCount > 0)
    const active = cards.filter((card) =>
      ["accepted", "queued", "running"].includes(card.status),
    )
    const degraded = cards.filter((card) =>
      ["degraded", "failed", "unavailable"].includes(card.status),
    )
    const dto = PublicWatchIndexDtoSchema.parse({
      kind: "publicWatchIndex",
      boundary: publicDiscoveryBoundary(),
      replayReady,
      active,
      degraded,
      emptyStates: cards.length
        ? []
        : [
            "No public MatchSet index is configured yet. Public object pages still fail closed through their existing public reads.",
          ],
    })
    return assertDiscovery(dto)
  }

  const getPublicHomeDiscovery = async (): Promise<PublicHomeDiscoveryDto> => {
    const [watch, competitionIndex] = await Promise.all([
      getPublicWatchIndex(),
      getPublicCompetitionIndex(),
    ])
    const latestEvidence = [
      ...watch.replayReady,
      ...watch.active,
      ...watch.degraded,
    ].slice(0, 6)
    const dto = PublicHomeDiscoveryDtoSchema.parse({
      kind: "publicHomeDiscovery",
      boundary: publicDiscoveryBoundary(),
      competitions: competitionIndex.activeCompetitions.slice(0, 4),
      latestEvidence,
      players: [],
      strategies: [],
      learnLinks: [...learnLinks],
      emptyStates: [
        ...competitionIndex.emptyStates,
        ...(latestEvidence.length
          ? []
          : [
              "Recent public MatchSet discovery awaits a configured public index; direct replay and result pages remain available.",
            ]),
        "Player and Strategy discovery lists await public-safe index reads; direct public cards remain available by canonical URL.",
      ],
    })
    return assertDiscovery(dto)
  }

  const getPublicCompetitionDetail = async (
    competitionId: string,
  ): Promise<PublicCompetitionDetailDto | null> => {
    const parsed = parseCompetitionId(competitionId)
    if (!parsed) {
      return null
    }
    if (parsed.kind === "exhibition") {
      const preset = COMPETITION_PRESETS.find(
        (candidate) => candidate.id === parsed.presetId,
      )
      if (!preset) {
        return null
      }
      const watch = await getPublicWatchIndex()
      const matchSets = [
        ...watch.replayReady,
        ...watch.active,
        ...watch.degraded,
      ].filter((card) => card.presetId === preset.id)
      const competition = toPresetCompetitionCard(preset)
      const dto = PublicCompetitionDetailDtoSchema.parse({
        kind: "publicCompetitionDetail",
        boundary: publicDiscoveryBoundary(),
        competition,
        entrants: [],
        standings: [],
        matchSets,
        replayCoverage: {
          replayReadyCount: matchSets.reduce(
            (total, card) => total + card.replayReadyCount,
            0,
          ),
          matchCount: matchSets.reduce(
            (total, card) => total + card.matchCount,
            0,
          ),
          label:
            "Replay coverage appears as public exhibitions complete and publish Chronicle evidence.",
        },
        scheduleLabel:
          "On-demand mirrored pairwise MatchSets from signed-in Strategy Revisions.",
      })
      return assertDiscovery(dto)
    }

    const ladder = await deps.getLadderSeason(parsed.seasonId)
    if (!ladder) {
      return null
    }
    const competition = toLadderCompetitionCard(ladder)
    const matchSets = ladder.matchSets.map((matchSet) => ({
      matchSetId: matchSet.matchSetId,
      title: ladder.name,
      status: matchSet.status,
      statusLabel: statusLabel(matchSet.status),
      evidenceLabel:
        matchSet.countedStatus === "counted"
          ? "Counted ladder evidence"
          : (matchSet.publicExplanation ?? matchSet.countedStatus),
      resultHref: matchSet.resultHref,
      ...(matchSet.replayHref ? { replayHref: matchSet.replayHref } : {}),
      replayReadyCount: matchSet.replayHref ? 1 : 0,
      matchCount: 1,
      entrantLabels: matchSet.entrantIds,
      origin: "configured-public-read" as const,
    }))
    const dto = PublicCompetitionDetailDtoSchema.parse({
      kind: "publicCompetitionDetail",
      boundary: publicDiscoveryBoundary(),
      competition,
      entrants: ladder.entries.map((entry) => ({
        entrantId: entry.entrantId,
        label: entry.displayLabel,
        ownerHandle: entry.ownerHandle,
        playerHref: `/players/${encode(entry.ownerHandle)}`,
        strategyRevisionId: entry.strategyRevisionId,
        statusLabel: entry.status,
      })),
      standings: ladder.standings.map((standing) => ({
        rank: standing.rank,
        label: standing.displayLabel,
        points: standing.points,
        record: `${standing.wins}-${standing.losses}-${standing.draws}`,
      })),
      matchSets,
      replayCoverage: {
        replayReadyCount: matchSets.reduce(
          (total, card) => total + card.replayReadyCount,
          0,
        ),
        matchCount: matchSets.reduce(
          (total, card) => total + card.matchCount,
          0,
        ),
        label: ladder.publication.publicReplayEvidence
          ? "Public replay evidence enabled for this ladder."
          : "Replay evidence is not published for this ladder.",
      },
      scheduleLabel:
        ladder.status === "scheduling" || ladder.status === "active"
          ? "Schedule and pods are published through public MatchSets."
          : "Schedule appears when this ladder is scheduled.",
    })
    return assertDiscovery(dto)
  }

  const getSignedInCompetitionEntryDashboard = async (
    competitionId: string,
  ): Promise<SignedInCompetitionEntryDashboardDto | null> => {
    const detail = await getPublicCompetitionDetail(competitionId)
    if (!detail) {
      return null
    }

    let accountUnavailable = false
    let revisionsUnavailable = false
    let user: AccountReadUser | null = null
    let revisions: AccountReadRevisionSummary[] = []
    try {
      user = await deps.getCurrentUser()
    } catch (error) {
      if (
        isGoBackendServiceUnavailableError(error) ||
        (error instanceof CompetitiveInputError && error.status === 401)
      ) {
        accountUnavailable = isGoBackendServiceUnavailableError(error)
      } else {
        throw error
      }
    }
    if (user) {
      try {
        revisions = await deps.listRevisions()
      } catch (error) {
        if (isGoBackendServiceUnavailableError(error)) {
          revisionsUnavailable = true
        } else {
          throw error
        }
      }
    }

    const validRevisions = revisions.filter((revision) => revision.valid)
    const invalidRevisions = revisions.filter((revision) => !revision.valid)
    const entryMode =
      parseCompetitionId(competitionId)?.kind === "exhibition"
        ? "exhibition-preset"
        : "unavailable"
    const dto = SignedInCompetitionEntryDashboardDtoSchema.parse({
      kind: "signedInCompetitionEntryDashboard",
      boundary: publicDiscoveryBoundary(),
      competition: detail.competition,
      signedIn: Boolean(user),
      accountUnavailable,
      revisionsUnavailable,
      user: user
        ? {
            handle: user.handle,
            displayName: user.displayName,
            accountHref: "/account",
          }
        : null,
      eligibleRevisions: validRevisions.map((revision) => ({
        strategyRevisionId: revision.id,
        strategyId: revision.strategyId,
        label: revision.label ?? "Untitled revision",
        publicStrategyHref: `/strategies/${encode(revision.strategyId)}`,
        sourceHash: revision.sourceHash,
        sourceBytes: revision.sourceBytes,
        runtimeLabel: revisionRuntimeLabel(revision),
        languageId: revision.runtimeSemantics.languageId,
        languageLabel: revision.runtimeSemantics.languageLabel,
        countedPlayLabel: revision.runtimeSemantics.countedPlayLabel,
        countedPlayEligible:
          revision.runtimeSemantics.countedPlayEligible === true,
        countedPlayReason: revision.runtimeSemantics.countedPlayReason,
        createdAt: revision.createdAt,
      })),
      ineligibleRevisions: invalidRevisions.map((revision) => ({
        strategyRevisionId: revision.id,
        label: revision.label ?? "Untitled revision",
        runtimeLabel: revisionRuntimeLabel(revision),
        reason: "Revision must validate before competition entry.",
      })),
      entryMode,
      ...(entryMode === "exhibition-preset"
        ? { entryHref: "/api/exhibitions" }
        : {}),
    })
    return assertDiscovery(dto)
  }

  return {
    getPublicHomeDiscovery,
    getPublicWatchIndex,
    getPublicCompetitionIndex,
    getPublicCompetitionDetail,
    getSignedInCompetitionEntryDashboard,
  }
}

const publicDiscoveryService = createPublicDiscoveryService()

export const getPublicHomeDiscovery =
  publicDiscoveryService.getPublicHomeDiscovery
export const getPublicWatchIndex = publicDiscoveryService.getPublicWatchIndex
export const getPublicCompetitionIndex =
  publicDiscoveryService.getPublicCompetitionIndex
export const getPublicCompetitionDetail =
  publicDiscoveryService.getPublicCompetitionDetail
export const getSignedInCompetitionEntryDashboard =
  publicDiscoveryService.getSignedInCompetitionEntryDashboard
