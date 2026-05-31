import type {
  MatchExecutionFailureCategoryV1,
  MatchExecutionLifecycleStateV1,
  Position,
  SoldierSnapshot,
} from "@cowards/spec"
import type { PublicReadMatchSetResultDto } from "../lib/public-service-boundary.js"
import type {
  ReplayPageData,
  ReplayReadyDto,
  ReplayStateDto,
  ReplayTimelineEntryDto,
} from "./matches/types.js"

export type IntelligenceAvailabilityBand =
  | "ready"
  | "partial"
  | "pending"
  | "unavailable"

export type IntelligenceConfidenceBand = "high" | "medium" | "low" | "none"

export interface IntelligenceMetric {
  label: string
  value: string
  tone?: "neutral" | "good" | "warning" | "danger" | undefined
}

export interface ResultIntelligenceJumpTarget {
  label: string
  href: string
  confidence: IntelligenceConfidenceBand
}

export interface ResultComparisonRow {
  label: string
  runtime: string
  record: string
  evidence: string
}

export interface ResultIntelligenceViewModel {
  availability: IntelligenceAvailabilityBand
  confidence: IntelligenceConfidenceBand
  headline: string
  summary: string
  provenance: string
  metrics: IntelligenceMetric[]
  comparisonRows: ResultComparisonRow[]
  jumpTargets: ResultIntelligenceJumpTarget[]
}

export interface ReplayAnnotationViewModel {
  category:
    | "turning-point"
    | "movement"
    | "engagement"
    | "contraction"
    | "cleanup"
    | "status"
    | "outcome"
  label: string
  sequence: number
  round: string
  activation: string
  cycle: string
  confidence: IntelligenceConfidenceBand
  evidenceSource: string
  href: string
}

export interface SoldierProgressionViewModel {
  id: string
  label: string
  owner: string
  status: SoldierSnapshot["status"]
  lastVisiblePosition: string
  recentPublicEvents: string
}

export interface ReplayTacticalPanel {
  id: string
  title: string
  summary: string
  metrics: IntelligenceMetric[]
}

export interface ReplayIntelligenceViewModel {
  availability: IntelligenceAvailabilityBand
  confidence: IntelligenceConfidenceBand
  headline: string
  summary: string
  provenance: string
  annotations: ReplayAnnotationViewModel[]
  soldiers: SoldierProgressionViewModel[]
  panels: ReplayTacticalPanel[]
}

const publicEvidenceProvenance =
  "Derived from frozen public result/replay DTOs and public Chronicle projections only; private Strategy data, owner-only debug data, diagnostic detail, host detail, credentials, persistence internals, and runtime internals are excluded."

const lifecycleIntelligenceCopy: Record<
  MatchExecutionLifecycleStateV1,
  string
> = {
  queued:
    "Intelligence is pending until public Match evidence exists. No tactical conclusion is inferred.",
  accepted:
    "Execution has been accepted, but public tactical evidence is not available yet.",
  running:
    "Execution is in progress. Public evidence can be monitored, but tactical analysis remains provisional.",
  complete:
    "Completed public evidence can support tactical comparison and replay-backed jump targets when replay links exist.",
  failed:
    "Failed public evidence supports state-specific limits, not hidden execution diagnosis.",
  degraded:
    "Partial public evidence can be summarized, but clean outcome claims stay withheld.",
  unavailable:
    "Execution evidence is unavailable, so tactical intelligence is explicitly unavailable.",
}

const failureIntelligenceCopy: Record<MatchExecutionFailureCategoryV1, string> =
  {
    strategy_failure:
      "Public evidence says a Strategy failed; hidden Strategy intent is not inferred.",
    system_failure:
      "Public evidence says system execution failed; private infrastructure detail stays withheld.",
    timeout:
      "Public evidence says execution timed out; this is not expanded into private runtime diagnosis.",
    runtime_unavailable:
      "The runtime lane was unavailable, so tactical intelligence cannot be derived.",
    malformed_runtime_result:
      "Runtime output was rejected before safe tactical evidence could be trusted.",
    stale_artifact:
      "Artifact evidence was stale, so replay-backed intelligence is not trusted.",
    blocked:
      "The Match was blocked before enough public evidence existed for tactical analysis.",
    missing_chronicle:
      "The public Chronicle projection is missing, so replay-backed intelligence is unavailable.",
    no_result:
      "No public result was published, so tactical intelligence remains unavailable.",
  }

const countBy = <T>(items: readonly T[], label: (item: T) => string) => {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = label(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

const formatCounts = (counts: Map<string, number>): string =>
  counts.size
    ? [...counts.entries()]
        .map(([label, count]) => `${label}: ${count}`)
        .join(", ")
    : "none"

const matchEvidenceLabel = (
  match: PublicReadMatchSetResultDto["matches"][number],
) => {
  if (match.replayHref) {
    return "replay-backed"
  }
  if (match.publicReason) {
    return match.publicReason.replaceAll("_", " ")
  }
  return match.status.replaceAll("_", " ")
}

const resultAvailability = (
  result: PublicReadMatchSetResultDto,
): IntelligenceAvailabilityBand => {
  if (
    result.lifecycle.state === "queued" ||
    result.lifecycle.state === "accepted"
  ) {
    return "pending"
  }
  if (
    result.lifecycle.state === "unavailable" ||
    result.lifecycle.failureCategory === "no_result" ||
    result.lifecycle.failureCategory === "missing_chronicle"
  ) {
    return "unavailable"
  }
  if (
    result.lifecycle.state === "degraded" ||
    result.lifecycle.state === "running" ||
    result.lifecycle.resultAvailability === "partial"
  ) {
    return "partial"
  }
  return result.matches.some((match) => match.replayHref) ? "ready" : "partial"
}

const confidenceForAvailability = (
  availability: IntelligenceAvailabilityBand,
): IntelligenceConfidenceBand => {
  switch (availability) {
    case "ready":
      return "high"
    case "partial":
      return "medium"
    case "pending":
      return "low"
    case "unavailable":
      return "none"
  }
}

const recordForEntrant = (
  result: PublicReadMatchSetResultDto,
  entrantId: string,
): string => {
  const standing = result.standings.find(
    (candidate) => candidate.entrantId === entrantId,
  )
  return standing
    ? `${standing.wins}-${standing.losses}-${standing.draws}; ${standing.points} points`
    : "not scored yet"
}

export const buildResultIntelligenceViewModel = (
  result: PublicReadMatchSetResultDto,
  entrantRuntimeLabels: readonly string[],
): ResultIntelligenceViewModel => {
  const availability = resultAvailability(result)
  const replayBackedMatches = result.matches.filter((match) => match.replayHref)
  const matchStatusCounts = countBy(result.matches, matchEvidenceLabel)
  const stateCopy =
    result.lifecycle.failureCategory === undefined
      ? lifecycleIntelligenceCopy[result.lifecycle.state]
      : failureIntelligenceCopy[result.lifecycle.failureCategory]
  const confidence = confidenceForAvailability(availability)
  const jumpTargets = replayBackedMatches.flatMap((match) => [
    {
      label: `${match.matchId} decisive push`,
      href: `${match.replayHref}?moment=DECISIVE_PUSH`,
      confidence: "medium" as const,
    },
    {
      label: `${match.matchId} fall/stone check`,
      href: `${match.replayHref}?moment=FALL`,
      confidence: "medium" as const,
    },
  ])

  return {
    availability,
    confidence,
    headline:
      availability === "ready"
        ? "Replay-backed Match intelligence is available."
        : availability === "partial"
          ? "Partial public evidence supports limited intelligence."
          : availability === "pending"
            ? "Match intelligence is pending public evidence."
            : "Match intelligence is unavailable from public evidence.",
    summary: stateCopy,
    provenance: publicEvidenceProvenance,
    metrics: [
      {
        label: "evidence",
        value: availability,
        tone:
          availability === "ready"
            ? "good"
            : availability === "unavailable"
              ? "danger"
              : "warning",
      },
      { label: "confidence", value: confidence },
      {
        label: "replay-backed Matches",
        value: `${replayBackedMatches.length}/${result.matches.length}`,
      },
      { label: "public Match mix", value: formatCounts(matchStatusCounts) },
    ],
    comparisonRows: result.entrants.map((entrant, index) => ({
      label: entrant.displayLabel,
      runtime:
        entrantRuntimeLabels[index] ??
        `${entrant.runtime.language.id} · ${entrant.runtime.adapter.id}`,
      record: recordForEntrant(result, entrant.entrantId),
      evidence: replayBackedMatches.length
        ? "Replay-backed public evidence exists."
        : stateCopy,
    })),
    jumpTargets,
  }
}

const stateAtOrBefore = (
  data: ReplayReadyDto,
  sequence: number,
): ReplayStateDto | undefined =>
  [...data.states].reverse().find((state) => state.sequence <= sequence) ??
  data.states[0]

const latestState = (data: ReplayReadyDto): ReplayStateDto | undefined =>
  data.states.at(-1) ?? data.states[0]

const formatPosition = (position: Position | null | undefined): string =>
  position ? `${position.x},${position.y}` : "off-board"

const annotationForEntry = (
  data: ReplayReadyDto,
  entry: ReplayTimelineEntryDto,
): ReplayAnnotationViewModel | null => {
  const base = {
    sequence: entry.sequence,
    round: entry.round === undefined ? "Match" : `Round ${entry.round}`,
    activation:
      entry.activation === undefined
        ? "None"
        : `Activation ${entry.activation + 1}`,
    cycle: entry.cycle === undefined ? "None" : `Cycle ${entry.cycle}`,
    evidenceSource: "public Chronicle projection",
    href: `/matches/${encodeURIComponent(data.metadata.matchId)}/replay?sequence=${entry.sequence}`,
  }

  switch (entry.type) {
    case "BACKSTAB_RESOLVED":
      return {
        ...base,
        category: "engagement",
        label: "Backstab resolved",
        confidence: "high",
      }
    case "PUSH_RESOLVED":
      return {
        ...base,
        category: "turning-point",
        label: "Decisive push candidate",
        confidence: "high",
      }
    case "PUSH_ATTEMPTED":
      return {
        ...base,
        category: "engagement",
        label: "Push pressure",
        confidence: "medium",
      }
    case "MOVE_ADVANCED":
      return {
        ...base,
        category: "movement",
        label: "Advance changed board pressure",
        confidence: "medium",
      }
    case "MOVE_BLOCKED":
    case "PUSH_BLOCKED":
      return {
        ...base,
        category: "cleanup",
        label:
          entry.type === "MOVE_BLOCKED" ? "No-advance cleanup" : "Push blocked",
        confidence: "medium",
      }
    case "SOLDIER_STONED":
      return {
        ...base,
        category: "status",
        label: "Soldier became STONE",
        confidence: "high",
      }
    case "SOLDIER_FELL":
      return {
        ...base,
        category: "status",
        label: "Soldier became FALLEN",
        confidence: "high",
      }
    case "CONTRACTION_RESOLVED":
      return {
        ...base,
        category: "contraction",
        label: "Board contraction pressure",
        confidence: "high",
      }
    case "CYCLE_ENDED":
      return entry.cycle !== undefined && entry.cycle >= 10
        ? {
            ...base,
            category: "turning-point",
            label: "Late-cycle stabilization",
            confidence: "low",
          }
        : null
    case "MATCH_ENDED":
      return {
        ...base,
        category: "outcome",
        label: "Outcome settled",
        confidence: "high",
      }
    default:
      return null
  }
}

const soldierEventCount = (
  timeline: readonly ReplayTimelineEntryDto[],
  soldierId: string,
): number =>
  timeline.filter((entry) => {
    if (entry.context.soldierId === soldierId) {
      return true
    }
    return JSON.stringify(entry.payload).includes(soldierId)
  }).length

const soldierLabel = (soldier: SoldierSnapshot, index: number): string =>
  `${soldier.ownerPlayerId}:${index + 1}`

const buildSoldierProgression = (
  data: ReplayReadyDto,
): SoldierProgressionViewModel[] => {
  const finalState = latestState(data)
  if (!finalState) {
    return []
  }
  return finalState.board.soldiers.map((soldier, index) => ({
    id: soldier.id,
    label: soldierLabel(soldier, index),
    owner: soldier.ownerPlayerId,
    status: soldier.status,
    lastVisiblePosition:
      soldier.status === "FALLEN" ? "FALLEN" : formatPosition(soldier.position),
    recentPublicEvents: `${soldierEventCount(data.timeline, soldier.id)} public event${soldierEventCount(data.timeline, soldier.id) === 1 ? "" : "s"}`,
  }))
}

const isCenter = (
  position: Position,
  bounds: ReplayStateDto["board"]["bounds"],
): boolean => {
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return (
    Math.abs(position.x - centerX) <= 2 && Math.abs(position.y - centerY) <= 2
  )
}

const buildReplayPanels = (data: ReplayReadyDto): ReplayTacticalPanel[] => {
  const finalState = latestState(data)
  const startState = stateAtOrBefore(data, 0)
  if (!finalState) {
    return []
  }
  const visibleSoldiers = finalState.board.soldiers.filter(
    (soldier) => soldier.status !== "FALLEN" && soldier.position,
  )
  const stoneSoldiers = visibleSoldiers.filter(
    (soldier) => soldier.status === "STONE",
  )
  const activeSoldiers = visibleSoldiers.filter(
    (soldier) => soldier.status === "ACTIVE",
  )
  const centerOccupants = visibleSoldiers.filter(
    (soldier) =>
      soldier.position && isCenter(soldier.position, finalState.board.bounds),
  )
  const actionMix = countBy(data.timeline, (entry) => entry.type)
  const ownerOccupancy = countBy(
    visibleSoldiers,
    (soldier) => soldier.ownerPlayerId,
  )
  const startBounds = startState?.board.bounds ?? finalState.board.bounds
  const currentArea =
    (finalState.board.bounds.maxX - finalState.board.bounds.minX + 1) *
    (finalState.board.bounds.maxY - finalState.board.bounds.minY + 1)
  const startArea =
    (startBounds.maxX - startBounds.minX + 1) *
    (startBounds.maxY - startBounds.minY + 1)

  return [
    {
      id: "board-control",
      title: "Board Control",
      summary:
        "Occupancy is derived from visible ACTIVE and STONE Soldiers only; FALLEN Soldiers are not counted as board occupants.",
      metrics: [
        { label: "active", value: `${activeSoldiers.length}` },
        { label: "STONE", value: `${stoneSoldiers.length}` },
        { label: "center pressure", value: `${centerOccupants.length}` },
        {
          label: "by side",
          value: formatCounts(ownerOccupancy),
        },
      ],
    },
    {
      id: "terrain-stone",
      title: "Terrain and STONE",
      summary:
        "Terrain and STONE pressure uses public board snapshots and excludes off-board FALLEN Soldiers.",
      metrics: [
        { label: "terrain", value: `${finalState.board.terrainStones.length}` },
        { label: "STONE Soldiers", value: `${stoneSoldiers.length}` },
        {
          label: "visible area",
          value: `${currentArea}/${startArea} cells`,
          tone: currentArea < startArea ? "warning" : "neutral",
        },
      ],
    },
    {
      id: "action-mix",
      title: "Action Mix",
      summary:
        "Public event counts summarize moves, turns, pushes, backstabs, contraction, status changes, and outcomes without hidden Strategy intent.",
      metrics: [
        { label: "events", value: `${data.timeline.length}` },
        { label: "mix", value: formatCounts(actionMix) },
      ],
    },
  ]
}

export const buildReplayIntelligenceViewModel = (
  data: ReplayPageData,
): ReplayIntelligenceViewModel => {
  if (data.status === "unavailable") {
    return {
      availability: "unavailable",
      confidence: "none",
      headline: "Replay intelligence unavailable",
      summary: data.message,
      provenance: publicEvidenceProvenance,
      annotations: [],
      soldiers: [],
      panels: [],
    }
  }

  const annotations = data.timeline
    .map((entry) => annotationForEntry(data, entry))
    .filter(
      (annotation): annotation is ReplayAnnotationViewModel =>
        annotation !== null,
    )
  const hasBoardStates = data.states.length > 0
  return {
    availability: hasBoardStates ? "ready" : "partial",
    confidence: annotations.length ? "high" : "medium",
    headline: annotations.length
      ? "Replay-backed tactical annotations are available."
      : "Replay is ready, but public tactical signal is sparse.",
    summary:
      "Annotations, jump targets, Soldier progression, board control, terrain/STONE occupancy, and action mix are derived from public replay projection data.",
    provenance: publicEvidenceProvenance,
    annotations,
    soldiers: buildSoldierProgression(data),
    panels: buildReplayPanels(data),
  }
}
