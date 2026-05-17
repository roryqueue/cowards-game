import { getMatchReplay } from "../../server.js"
import type { ReplayViewMode } from "../../types.js"
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

  const statusLabel = data.mode === "owner" ? "Owner debug" : "Public view"

  return (
    <main className="replay-page">
      <header className="replay-header">
        <div>
          <p className="replay-product-label">Coward&apos;s Game</p>
          <h1>Replay</h1>
        </div>
        <span className="replay-status-chip">{statusLabel}</span>
      </header>

      <section className="replay-shell" aria-label="Match replay">
        <aside className="replay-rail" aria-label="Match metadata">
          <p className="replay-label">Match</p>
          <p className="replay-mono" title={data.metadata.matchId}>
            {data.metadata.matchId}
          </p>
          <p className="replay-label">Events</p>
          <p>{data.metadata.eventCount}</p>
        </aside>

        <section className="replay-arena-placeholder" aria-label="Replay board">
          <p className="replay-label">Current position</p>
          <p className="replay-position">
            {data.timeline[0]?.label ?? "Match start"}
          </p>
        </section>

        <aside className="replay-rail" aria-label="Replay inspector">
          <p className="replay-label">Inspector</p>
          <p>{statusLabel}</p>
          <p className="replay-label">Initial sequence</p>
          <p>{data.initialSequence}</p>
        </aside>
      </section>
    </main>
  )
}
