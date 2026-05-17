import { getMatchReplay } from "../../server.js"
import { ReplayClient } from "./replay-client.js"
import { ReplayUnavailable } from "./replay-unavailable.js"

export const dynamic = "force-dynamic"

interface ReplayPageProps {
  params: Promise<{ matchId: string }> | { matchId: string }
}

export default async function ReplayPage({ params }: ReplayPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const data = await getMatchReplay(resolvedParams.matchId)

  if (data.status === "unavailable") {
    return <ReplayUnavailable data={data} />
  }

  return <ReplayClient data={data} />
}
