import { getMatchReplay } from "../../server.js"
import type { ReplayViewMode } from "../../types.js"
import { ReplayClient } from "./replay-client.js"
import { ReplayUnavailable } from "./replay-unavailable.js"

export const dynamic = "force-dynamic"

interface ReplayPageProps {
  params: Promise<{ matchId: string }> | { matchId: string }
  searchParams?:
    | Promise<{
        mode?: string | string[] | undefined
        ownerPlayerId?: string | string[] | undefined
      }>
    | {
        mode?: string | string[] | undefined
        ownerPlayerId?: string | string[] | undefined
      }
    | undefined
}

const firstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value)

export default async function ReplayPage({
  params,
  searchParams,
}: ReplayPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  const modeParam = firstValue(resolvedSearchParams.mode)
  const ownerPlayerId = firstValue(resolvedSearchParams.ownerPlayerId)
  const mode: ReplayViewMode = modeParam === "owner" ? "owner" : "public"
  const data = await getMatchReplay(resolvedParams.matchId, {
    mode,
    ownerPlayerId,
  })

  if (data.status === "unavailable") {
    return <ReplayUnavailable data={data} />
  }

  return <ReplayClient data={data} />
}
