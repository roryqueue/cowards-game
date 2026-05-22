import { mkdir, writeFile } from "node:fs/promises"
import { createWorkshopAnalyticsDemoSnapshot } from "../packages/persistence/src/workshop-analytics.ts"

const outputDir = new URL(
  "../.planning/phases/44-demo-docs-verification/artifacts/",
  import.meta.url,
)

const main = async () => {
  const snapshot = createWorkshopAnalyticsDemoSnapshot()
  const run = snapshot.runs[0]
  if (!run) {
    throw new Error("v1.6 analytics demo did not produce a run.")
  }

  const bandCounts = run.summary.matchupRecords.reduce<Record<string, number>>(
    (acc, matchup) => {
      acc[matchup.evidence.band] = (acc[matchup.evidence.band] ?? 0) + 1
      return acc
    },
    {},
  )
  const weakest = [...run.summary.matchupRecords].sort(
    (left, right) =>
      left.points - right.points ||
      right.losses - left.losses ||
      left.opponent.label.localeCompare(right.opponent.label),
  )[0]

  await mkdir(outputDir, { recursive: true })
  await writeFile(
    new URL("v1.6-analytics-demo.json", outputDir),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  )
  await writeFile(
    new URL("v1.6-analytics-demo-summary.md", outputDir),
    [
      "# v1.6 Analytics Demo Summary",
      "",
      `- Profile: ${snapshot.profiles[0]?.name ?? "unknown"}`,
      `- Run: ${run.id}`,
      `- Matchups: ${run.summary.totals.matchups}`,
      `- W-L-D: ${run.summary.totals.wins}-${run.summary.totals.losses}-${run.summary.totals.draws}`,
      `- Points: ${run.summary.totals.points}`,
      `- Evidence bands: ${Object.entries(bandCounts)
        .map(([band, count]) => `${band}=${count}`)
        .join(", ")}`,
      `- Weakest matchup: ${weakest?.opponent.label ?? "unknown"} (${weakest?.points ?? 0} points)`,
      `- Representative replay: ${weakest?.replayReferences[0]?.href ?? "unavailable"}`,
      "",
      "The demo data is deterministic and owner-safe: it contains revision ids, hashes, MatchSet ids, aggregate scoring, evidence bands, and replay references, but no Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, or owner debug.",
      "",
    ].join("\n"),
  )
}

await main()
