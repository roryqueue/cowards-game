import { COMPETITION_PRESETS } from "@cowards/spec"
import { ExhibitionClient } from "../../../exhibitions/new/exhibition-client.js"
import { getSignedInCompetitionEntryDashboard } from "../../../../lib/public-discovery-service.js"

export const dynamic = "force-dynamic"

const decodePathId = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default async function CompetitionEnterPage({
  params,
}: {
  params: Promise<{ competitionId: string }> | { competitionId: string }
}) {
  const { competitionId } = await params
  const dashboard = await getSignedInCompetitionEntryDashboard(competitionId)

  if (!dashboard) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Competition entry</p>
              <h1>Not found</h1>
            </div>
            <a href="/competitions">Competitions</a>
          </div>
        </section>
      </main>
    )
  }

  if (!dashboard.signedIn) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Competition entry</p>
              <h1>Sign in required</h1>
            </div>
            <div className="app-actions">
              <a href="/auth/sign-in">Sign in</a>
              <a href="/workshop">Workshop</a>
            </div>
          </div>
          {dashboard.accountUnavailable ? (
            <p className="workshop-muted">
              Account services are temporarily unavailable. Entry reads failed
              closed without source exposure.
            </p>
          ) : null}
          <p>
            Entry requires a session-backed account so saved Strategy Revision
            ownership can be checked before competition creation.
          </p>
        </section>
      </main>
    )
  }

  if (dashboard.entryMode !== "exhibition-preset") {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Competition entry</p>
              <h1>Entry unavailable</h1>
            </div>
            <a href={dashboard.competition.href}>Competition detail</a>
          </div>
          <p className="workshop-muted">
            This competition does not expose a signed-in entry flow yet.
          </p>
        </section>
      </main>
    )
  }

  const decodedCompetitionId = decodePathId(competitionId)
  const presetId = decodedCompetitionId.replace(/^exhibition:/, "")
  const selectedPreset = COMPETITION_PRESETS.find(
    (preset) => preset.id === presetId,
  )
  const presets = (selectedPreset ? [selectedPreset] : COMPETITION_PRESETS).map(
    (preset) => ({
      id: preset.id,
      label: preset.label,
      description:
        preset.id === "smoke-exhibition-v1"
          ? "Fast mirrored pairwise exhibition for quick checks."
          : "Broader mirrored pairwise exhibition for stronger evidence.",
      minEntrants: preset.entrantCount.min,
      maxEntrants: preset.entrantCount.max,
    }),
  )
  const revisions = dashboard.eligibleRevisions.map((revision) => ({
    id: revision.strategyRevisionId,
    strategyId: revision.strategyId,
    label: revision.label,
    sourceHash: revision.sourceHash,
    sourceBytes: revision.sourceBytes,
    valid: true,
    runtimeSemantics: {
      languageId: revision.languageId,
      languageLabel: revision.languageLabel,
      countedPlayLabel: revision.countedPlayLabel,
      countedPlayEligible: revision.countedPlayEligible,
      countedPlayReason: revision.countedPlayReason,
    },
    createdAt: revision.createdAt,
  }))

  return (
    <main className="app-page">
      {dashboard.revisionsUnavailable ? (
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Competition entry</p>
              <h1>Saved revisions unavailable</h1>
            </div>
            <a href="/account">Account</a>
          </div>
          <p className="workshop-muted">
            Account revision reads failed closed without showing Strategy
            source.
          </p>
        </section>
      ) : (
        <ExhibitionClient presets={presets} revisions={revisions} />
      )}
    </main>
  )
}
