# Phase 40 Plan: Matchup Heatmaps

## Goal
Show selected Strategy revisions against Starter and Advanced opponents in a dense Workshop heatmap with W-L-D, points, failures, side bias, and evidence count/band.

## Tasks
- Add pure heatmap formatting helpers.
- Add a Workshop heatmap component using existing Workshop panel/list styling.
- Render two-line desktop cells and compact mobile cells with text labels plus band styling.
- Include comparison mode for compatible demo runs when available.

## Verification
- Component/state tests for cell labels, exceptional reliability states, and public replay links.
- Browser checks on desktop and mobile widths for no overlap and realistic-looking evidence.
