import { getMatchReplay } from "../../server.js"
import { resolveOwnerDebugReplayOptions } from "./owner-debug.js"
import { ReplayClient } from "./replay-client.js"
import { ReplayUnavailable } from "./replay-unavailable.js"
import type { AnalyticsReplayMomentType } from "@cowards/spec"
import type { ReplayFocusRequest } from "../../types.js"

export const dynamic = "force-dynamic"

interface ReplayPageProps {
  params: Promise<{ matchId: string }> | { matchId: string }
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
}

const replayMoments = new Set<AnalyticsReplayMomentType>([
  "BACKSTAB",
  "CONTRACTION",
  "NO_ADVANCE_CLEANUP",
  "FALL",
  "DECISIVE_PUSH",
  "LATE_CYCLE_STABILIZATION",
])

const single = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

const resolveReplayFocus = (
  searchParams: Record<string, string | string[] | undefined> | undefined,
): ReplayFocusRequest | undefined => {
  const moment = single(searchParams?.moment)
  const sequence = single(searchParams?.sequence)
  const parsedSequence =
    sequence === undefined || !/^\d+$/.test(sequence)
      ? undefined
      : Number.parseInt(sequence, 10)
  const focus: ReplayFocusRequest = {
    ...(moment && replayMoments.has(moment as AnalyticsReplayMomentType)
      ? { moment: moment as AnalyticsReplayMomentType }
      : {}),
    ...(parsedSequence !== undefined &&
    Number.isInteger(parsedSequence) &&
    parsedSequence >= 0
      ? { sequence: parsedSequence }
      : {}),
  }
  return focus.moment || focus.sequence !== undefined ? focus : undefined
}

export default async function ReplayPage({
  params,
  searchParams,
}: ReplayPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await Promise.resolve(searchParams)
  const data = await getMatchReplay(
    resolvedParams.matchId,
    {
      ...resolveOwnerDebugReplayOptions(resolvedSearchParams),
      focus: resolveReplayFocus(resolvedSearchParams),
    },
  )

  if (data.status === "unavailable") {
    return <ReplayUnavailable data={data} />
  }

  return <ReplayClient data={data} />
}
