import type { JsonValue, MatchOutcome, SoldierSnapshot } from "@cowards/spec"
import type {
  ReplayPageData,
  ReplayReadyDto,
  ReplayStateDto,
  ReplayTimelineEntryDto,
} from "../../types.js"

export interface TimelineEventGroup {
  sequence: number
  label: string
  cycle?: number | undefined
}

export interface TimelineActivationGroup {
  activation: number | null
  label: string
  events: TimelineEventGroup[]
}

export interface TimelineRoundGroup {
  round: number | null
  label: string
  activations: TimelineActivationGroup[]
}

export interface CurrentPositionSummary {
  round: string
  activation: string
  currentEvent: string
  activeSide: string
  status: "ready"
  outcome: string
}

export interface SoldierHistoryEntry {
  sequence: number
  label: string
}

export interface SoldierInspector {
  shortLabel: string
  fullId: string
  owner: string
  status: SoldierSnapshot["status"]
  position: string
  facing: string
  lastSuccessfulMoveDirection: string
  recentHistory: SoldierHistoryEntry[]
}

export interface EventInspector {
  type: ReplayTimelineEntryDto["type"]
  sequence: number
  context: string
  payload: JsonValue
  privacyLabel: "Public event" | "Owner-only debug available"
}

export const getInitialReplaySequence = (data: ReplayPageData): number =>
  data.status === "ready" ? data.initialSequence : 0

export const clampTimelineIndex = (
  index: number,
  timelineLength: number,
): number => {
  if (timelineLength <= 0) {
    return 0
  }
  if (!Number.isFinite(index)) {
    return 0
  }
  return Math.min(Math.max(Math.trunc(index), 0), timelineLength - 1)
}

export const getTimelineEntryAt = (
  data: ReplayReadyDto,
  index: number,
): ReplayTimelineEntryDto =>
  data.timeline[clampTimelineIndex(index, data.timeline.length)] ??
  data.timeline[0]!

export const stepReplayIndex = (
  index: number,
  direction: -1 | 1,
  timelineLength: number,
): number => clampTimelineIndex(index + direction, timelineLength)

export const formatTimelinePosition = (
  entry: ReplayTimelineEntryDto,
): string => {
  const parts = [
    entry.round === undefined ? null : `Round ${entry.round}`,
    entry.activation === undefined
      ? null
      : `Activation ${entry.activation + 1}`,
    entry.label,
    entry.cycle === undefined ? null : `Cycle ${entry.cycle}`,
  ].filter((part): part is string => Boolean(part))

  return parts.join(" -> ")
}

const findOrCreateRound = (
  groups: TimelineRoundGroup[],
  round: number | null,
): TimelineRoundGroup => {
  let group = groups.find((candidate) => candidate.round === round)
  if (!group) {
    group = {
      round,
      label: round === null ? "Match" : `Round ${round}`,
      activations: [],
    }
    groups.push(group)
  }
  return group
}

const findOrCreateActivation = (
  round: TimelineRoundGroup,
  activation: number | null,
): TimelineActivationGroup => {
  let group = round.activations.find(
    (candidate) => candidate.activation === activation,
  )
  if (!group) {
    group = {
      activation,
      label:
        activation === null ? "Match events" : `Activation ${activation + 1}`,
      events: [],
    }
    round.activations.push(group)
  }
  return group
}

export const groupTimelineEntries = (
  entries: ReplayTimelineEntryDto[],
): TimelineRoundGroup[] => {
  const groups: TimelineRoundGroup[] = []

  for (const entry of entries) {
    const round = findOrCreateRound(groups, entry.round ?? null)
    const activation = findOrCreateActivation(round, entry.activation ?? null)
    activation.events.push({
      sequence: entry.sequence,
      label: entry.label,
      ...(entry.cycle === undefined ? {} : { cycle: entry.cycle }),
    })
  }

  return groups
}

const formatOutcome = (outcome: MatchOutcome | undefined): string => {
  if (!outcome) {
    return "In progress"
  }
  if (outcome.type === "DRAW") {
    return "Draw"
  }
  if (outcome.type === "FAILED") {
    return `Failed: ${outcome.reason}`
  }
  return `Winner: ${outcome.winnerPlayerId}`
}

const stateAtSequence = (
  data: ReplayReadyDto,
  sequence: number,
): ReplayStateDto | undefined =>
  data.states.find((state) => state.sequence === sequence) ?? data.states[0]

export const getCurrentPositionSummary = (
  data: ReplayReadyDto,
  entry: ReplayTimelineEntryDto,
): CurrentPositionSummary => {
  const state = stateAtSequence(data, entry.sequence)
  return {
    round: entry.round === undefined ? "Match start" : `Round ${entry.round}`,
    activation:
      entry.activation === undefined
        ? "No activation"
        : `Activation ${entry.activation + 1}`,
    currentEvent: entry.label,
    activeSide: entry.context.actingPlayerId ?? "No active player",
    status: "ready",
    outcome: formatOutcome(state?.outcome),
  }
}

const soldierLabel = (soldier: SoldierSnapshot, all: SoldierSnapshot[]) => {
  const sameOwner = all.filter(
    (candidate) => candidate.ownerPlayerId === soldier.ownerPlayerId,
  )
  return `${sameOwner.findIndex((candidate) => candidate.id === soldier.id) + 1}`
}

const formatPosition = (soldier: SoldierSnapshot): string =>
  soldier.position === null
    ? "FALLEN"
    : `${soldier.position.x},${soldier.position.y}`

const entryReferencesSoldier = (
  entry: ReplayTimelineEntryDto,
  soldierId: string,
): boolean => {
  const payload = JSON.stringify(entry.payload)
  return entry.context.soldierId === soldierId || payload.includes(soldierId)
}

export const getSoldierInspector = (
  data: ReplayReadyDto,
  selectedSoldierId: string | null,
  selectedSequence: number,
): SoldierInspector | null => {
  if (!selectedSoldierId) {
    return null
  }
  const state = stateAtSequence(data, selectedSequence)
  const soldier = state?.board.soldiers.find(
    (candidate) => candidate.id === selectedSoldierId,
  )
  if (!state || !soldier) {
    return null
  }

  const recentHistory = data.timeline
    .filter(
      (entry) =>
        entry.sequence <= selectedSequence &&
        entryReferencesSoldier(entry, selectedSoldierId),
    )
    .slice(-5)
    .map((entry) => ({ sequence: entry.sequence, label: entry.label }))

  return {
    shortLabel: soldierLabel(soldier, state.board.soldiers),
    fullId: soldier.id,
    owner: soldier.ownerPlayerId,
    status: soldier.status,
    position: formatPosition(soldier),
    facing: soldier.facing ?? "None",
    lastSuccessfulMoveDirection: soldier.lastSuccessfulMoveDirection ?? "None",
    recentHistory,
  }
}

export const getEventInspector = (
  entry: ReplayTimelineEntryDto,
): EventInspector => {
  const context = [
    entry.round === undefined ? null : `Round ${entry.round}`,
    entry.activation === undefined
      ? null
      : `Activation ${entry.activation + 1}`,
    entry.cycle === undefined ? null : `Cycle ${entry.cycle}`,
  ].filter((part): part is string => Boolean(part))

  return {
    type: entry.type,
    sequence: entry.sequence,
    context: context.join(" -> ") || "Match",
    payload: entry.payload,
    privacyLabel:
      entry.privacy === "owner" ? "Owner-only debug available" : "Public event",
  }
}

export const canShowOwnerDebug = (data: ReplayPageData): boolean =>
  data.status === "ready" &&
  data.projection.viewer.access === "owner" &&
  data.projection.ownerPrivate !== undefined
