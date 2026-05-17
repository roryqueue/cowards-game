import { getMatchReplay } from "../../server.js"
import { resolveOwnerDebugReplayOptions } from "./owner-debug.js"
import { ReplayClient } from "./replay-client.js"
import { ReplayUnavailable } from "./replay-unavailable.js"

export const dynamic = "force-dynamic"

interface ReplayPageProps {
  params: Promise<{ matchId: string }> | { matchId: string }
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
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
    resolveOwnerDebugReplayOptions(resolvedSearchParams),
  )

  if (data.status === "unavailable") {
    return <ReplayUnavailable data={data} />
  }

  return <ReplayClient data={data} />
}
