# Phase 40 UI Spec: Matchup Heatmaps

## Contract
- The heatmap appears in the right-side Workshop workflow near gauntlet results, because this is where players already test revisions.
- Cells are fixed-size enough to stop W-L-D labels, point deltas, and band badges from resizing the grid.
- Every color-coded state also has text: Strong, Thin, Degraded, or System failed.
- Failure states prioritize reliability over outcome.
- Replay availability is visible but not noisy; representative moment links are shown in the selected details.

## States
- Empty: no profile run selected.
- Strong: counted, replay-backed, threshold met.
- Thin: counted, replay-backed, below threshold.
- Degraded: non-counted or replay-incomplete.
- System failed: system issue, not a Strategy result.

## Responsive
- Desktop: opponent columns with two-line cells.
- Mobile: stacked matchup rows with the same labels and accessible links.
